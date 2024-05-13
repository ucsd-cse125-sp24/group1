import http from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import { Game } from "../Game";
import { ClientMessage, ServerMessage, WSManagementMessage } from "../../common/messages";
import { Connection } from "./Server";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RECONNECT_TIMEOUT = 60 * 60 * 1000;

/**
 * An implementation of `Server` that starts a WebSocket server.
 *
 * To keep the scope of `WsServer` small, it does not depend on `Game`. However,
 * when this server is instantiated, it is given the instance of `Game`, where
 * the handlers are defined. Does this mean that the server is the top level
 * object of our entire game? In a way, yes. However, the server has limited
 * access to the game, so the game still retains most of the control.
 */
export class WsServer {
	#app = express();
	#server = http.createServer(this.#app);
	#wss = new WebSocketServer({ server: this.#server });

	#activeConnections = new Map<string, WebSocket>();
	#disconnectTimeouts = new Map<string, NodeJS.Timeout>();

	#game: Game;

	/**
	 * Function that hangs the server until a websocket client
	 * has connected. Once there are no clients remaining, hangs
	 * the server again.
	 *
	 * Called every time there's a new connection, but the function won't do
	 * anything if there are already connections to the server.
	 */
	#unhangServer = () => {};
	hasConnection = new Promise<void>((resolve) => {
		this.#unhangServer = resolve;
	});

	constructor(game: Game) {
		this.#app.use(express.static(path.join(__dirname, "..", "public")));

		this.#game = game;

		this.#app.get("/", (_req, res) => {
			res.sendFile(path.join(__dirname, "../public/index.html"));
		});

		this.#wss.on("connection", this.#handleNewConnection.bind(this));
	}

	#handleNewConnection(ws: WebSocket) {
		this.#unhangServer();

		/**
		 * A wrapper around the WebSocket object that stringifies the object before sending it.
		 *
		 * If we want to buffer messages before sending them all together, this is the place to do it.
		 */
		const connection: Connection<ServerMessage> = {
			send(message) {
				ws.send(JSON.stringify(message));
			},
		};

		this.#activeConnections.set(
			[...crypto.getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join(""),
			ws,
		);

		this.#game.handleOpen(connection);

		ws.on("message", (rawData) => {
			this.handleMessage(ws, rawData, connection);
		});

		ws.on("close", () => {
			const wsId = this.getIdFromWebSocket(ws);
			if (wsId == undefined) {
				throw "wsId should never be undefined :( " + wsId;
			}

			// Give players a while to reconnect
			this.#disconnectTimeouts.set(
				wsId,
				setTimeout(
					(() => {
						this.deleteConnection(wsId);
					}).bind(this),
					RECONNECT_TIMEOUT,
				),
			);

			if (this.#wss.clients.size === 0) {
				this.hasConnection = new Promise<void>((resolve) => {
					this.#unhangServer = resolve;
				});
			}
		});
	}

	deleteConnection(id: string) {
		this.#activeConnections.delete(id);
	}

	getIdFromWebSocket(ws: WebSocket): string | undefined {
		for (let [str, websocket] of this.#activeConnections.entries()) {
			if (ws == websocket) {
				return str;
			}
		}
	}

	handleMessage(ws: WebSocket, rawData: unknown, conn: Connection<ServerMessage>): void {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ClientMessage | WSManagementMessage;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		switch (data.type) {
			case "rejoin":
				if (typeof data.id !== "string") return;
				if (!this.#activeConnections.has(data.id)) return;

				let oldId = this.getIdFromWebSocket(ws);
				if (oldId) {
					this.#activeConnections.delete(oldId);
				}

				this.#activeConnections.get(data.id)?.close();
				this.#activeConnections.delete(data.id);
				this.#activeConnections.set(data.id, ws);

				clearTimeout(this.#disconnectTimeouts.get(data.id));
				return;
		}

		this.#game.handleMessage(data, conn);
	}

	broadcast(message: ServerMessage): void {
		for (const ws of this.#wss.clients) {
			ws.send(JSON.stringify(message));
		}
	}

	listen(port: number): void {
		this.#server.listen(port);
		console.log(`Listening on http://localhost:${port}/`);
	}
}
