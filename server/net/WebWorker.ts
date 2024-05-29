import { getRandomValues } from "crypto";
import ws from "ws";
import { ClientMessage, ClientControlMessage, ServerControlMessage, ServerMessage } from "../../common/messages";
import { Game } from "../Game";
import { Connection, Server, ServerHandlers } from "./Server";
import { log } from "./_tempDebugLog";

/**
 * Create a fake "server" that can run in a
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers|Web Worker}
 * (i.e. a separate thread) in the browser.
 *
 * Since our server is written in JavaScript, we can also run it in the browser.
 * Our game preview on GitHub Pages has no real server to connect to, which
 * makes it hard to preview changes to the server and game logic.
 *
 * With this Web Worker version of the server, if the client fails to connect to
 * the server, it can offer to start a worker that runs the same server code.
 * This is not unlike how Minecraft does singleplayer, hosting a server instance
 * locally in another thread.
 *
 * In the future, we could explore moving this to a service worker so it can
 * control multiple "clients" on different tabs.
 */
export class WebWorker<ReceiveType, SendType> implements Server<ReceiveType, SendType> {
	hasConnection = Promise.resolve();
	#handler: ServerHandlers<ReceiveType, SendType>;

	constructor(game: ServerHandlers<ReceiveType, SendType>) {
		this.#handler = game;
	}

	broadcast(message: SendType): void {
		self.postMessage(JSON.stringify(message));
	}

	listen(_port: number): void {
		const connection: Connection<SendType> = {
			id: "1234",
			send(message) {
				self.postMessage(JSON.stringify(message));
			},
		};

		self.addEventListener("message", (e) => {
			const data = JSON.parse(e.data);

			switch (data.type) {
				case "join":
					// Tell the game that they joined
					this.#handler.handlePlayerJoin(connection);

					// Ok we believe u 🥰 you are the client you say you are
					self.postMessage(
						JSON.stringify({
							type: "join-response",
							id: "",
						}),
					);
					return;
			}

			this.#handler.handleMessage(data, connection);
		});
	}
}
