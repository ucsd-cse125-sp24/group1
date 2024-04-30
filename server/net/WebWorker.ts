import { Server } from "./Server";

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
export class WebWorker<ReceiveType, SendType> extends Server<ReceiveType, SendType, symbol> {
	static #CONN_ID = Symbol();

	hasConnection = Promise.resolve();

	broadcast(message: SendType): void {
		self.postMessage(JSON.stringify(message));
	}

	listen(_port: number): void {
		for (const message of this.handleOpen(WebWorker.#CONN_ID)) {
			self.postMessage(JSON.stringify(message));
		}

		self.addEventListener("message", (e) => {
			const response = this.handleMessage(e.data, WebWorker.#CONN_ID);
			if (response) {
				self.postMessage(JSON.stringify(response));
			}
		});
	}
}
