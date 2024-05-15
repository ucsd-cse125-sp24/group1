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

	#createConnection (ws: WebSocket): Connection<ServerMessage | ServerControlMessage> {
		const id = [...crypto.getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");

		this.#activeConnections.set(id, ws);


		return {
			id,
			send(message) {
				ws.send(JSON.stringify(message));
			},
		};
	}

	#getConnection(ws: WebSocket): Connection<ServerMessage | ServerControlMessage> | null {
		const id = this.#activeConnections.rev_get(ws)
		if (!id) {
			return null;
		}
		/**
		 * A wrapper around the WebSocket object that stringifies the object before sending it.
		 *
		 * If we want to buffer messages before sending them all together, this is the place to do it.
		 */
		return {
			id,
			send(message) {
				ws.send(JSON.stringify(message));
			},
		};
	}

	#handleNewConnection(ws: WebSocket) {
		this.#unhangServer();

		ws.send(JSON.stringify({
			type: "who-the-h*ck-are-you"
		}));

		ws.on("message", (rawData) => {
			const connection = this.#getConnection(ws);
			if (connection) {this.handleMessage(ws, rawData, connection);}
		});

		ws.on("close", () => {
			const wsId = this.#activeConnections.rev_get(ws);
			if (!wsId) return;

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
				if (typeof data.id !== "string" && data.id !== null) return;

				// If this player is a reconnecting player
				if (!this.#activeConnections.has(data.id)) {
					// Tell the game that they joined
					this.#game.handlePlayerJoin(data.id, this.#getConnection(ws));
						
					ws.send(JSON.stringify({
							type: "rejoin-response",
						id: this.#activeConnections.rev_get(ws),
						successful: false
					} as ServerControlMessage));
						return;
				} else {
					let id = [...crypto.getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");
					this.#activeConnections.set(id, ws);
					this.#game.handleOpen(this.#getConnection(ws));
				}

				// If there's an old ID that corresponds to this WS, delete it
				if (this.#activeConnections.rev_has(ws)) {
					this.#activeConnections.rev_delete(ws);
				}

				// Close the old websocket by the provided join id if it already exists
				this.#activeConnections.get(data.id)?.close();
				this.#activeConnections.delete(data.id);

				// Link the new id to the new websocket
				this.#activeConnections.set(data.id, ws);
				
				// Don't remove id from list because player reconnected
				clearTimeout(this.#disconnectTimeouts.get(data.id));

				// Tell the player that a new player joined
				this.#game.handlePlayerJoin(data.id, this.#getConnection(ws));
				
				// Send the client the message telling them their id
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

class BiMap<K,V> {
	#map = new Map<K,V>();
	#pam = new Map<V,K>();
	size: number;
	
	constructor(){
		this.size = 0;
	}

	get(v: K): V | undefined {
		return this.#map.get(v);
	}
	has(k: K): boolean {
		return this.#map.has(k);
	}
	rev_has(v: V) {
		return this.#pam.has(v);
	}
	rev_get(v: V): K | undefined {
		return this.#pam.get(v);
	}

	set(k: K, v: V): this {
		this.#map.set(k, v);
		this.#pam.set(v, k);
		this.size++;
		return this;
	}

	delete(k: K): boolean {
		let v = this.#map.get(k);
		if (v) {
			this.#map.delete(k);
			this.#pam.delete(v);
			this.size--;
			return true;
		}
		return false;
	}
	rev_delete(v: V) {
		let k = this.#pam.get(v);
		if (k) {
			this.#map.delete(k);
			this.#pam.delete(v);
			this.size--;
			return true;
		}
		return false;
	}
	entries(): IterableIterator<[K, V]> {
		return this.#map.entries();
	}

	toString() {
		return this.#map.toString();
	}
}