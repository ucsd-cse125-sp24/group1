import http from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import { Game } from "../Game";
import { ClientControlMessage, ClientMessage, ServerControlMessage, ServerMessage } from "../../common/messages";
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

	#activeConnections = new BiMap<string, WebSocket>();
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
		const connection: Connection<ServerMessage | ServerControlMessage> = {
			send(message) {
				ws.send(JSON.stringify(message));
			},
		};

		const connectionId = [...crypto.getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");

		connection.send({
			type: "assign-client-id",
			id: connectionId,
		});

		this.#activeConnections.set(connectionId, ws);

		this.#game.handleOpen(connection);

		ws.on("message", (rawData) => {
			this.handleMessage(ws, rawData, connection);
		});

		ws.on("close", () => {
			const wsId = this.#activeConnections.rev_get(ws);
			if (!wsId) throw "wsId should never be undefined :(";

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

	handleMessage(ws: WebSocket, rawData: unknown, conn: Connection<ServerMessage>): void {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ClientMessage | ClientControlMessage;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		switch (data.type) {
			case "rejoin":
				if (typeof data.id !== "string") return;
				if (!this.#activeConnections.has(data.id)) {
					ws.send(JSON.stringify({
						type: "rejoin-response",
						id: this.#activeConnections.rev_get(ws),
						successful: false
					} as ServerControlMessage));
					return;
				}

				let oldId = this.#activeConnections.rev_get(ws);
				if (oldId) {
					this.#activeConnections.delete(oldId);
				}

				this.#activeConnections.get(data.id)?.close();
				this.#activeConnections.delete(data.id);
				this.#activeConnections.set(data.id, ws);

				clearTimeout(this.#disconnectTimeouts.get(data.id));
				ws.send(JSON.stringify({
					type: "rejoin-response",
					id: data.id,
					successful: true
				} as ServerControlMessage));
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

class BiMap<K,V> extends Map<K,V> {
	#map = new Map<K,V>();
	#pam = new Map<V,K>();

	constructor(){
		super();
	}

	get(v: K): V | undefined {
		return this.#map.get(v);
	}
	rev_get(v: V): K | undefined {
		return this.#pam.get(v);
	}

	set(k: K, v: V): this {
		this.#map.set(k, v);
		this.#pam.set(v, k);
		return this;
	}

	delete(k: K): boolean {
		let v = this.#map.get(k);
		if (v) {
			this.#map.delete(k);
			this.#pam.delete(v);
			return true;
		}
		return false;
	}
	rev_delete(v: V) {
		let k = this.#pam.get(v);
		if (k) {
			this.#map.delete(k);
			this.#pam.delete(v);
			return true;
		}
		return false;
	}
}