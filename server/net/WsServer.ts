import http from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { getRandomValues } from "crypto";
import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import { Game } from "../Game";
import { ClientControlMessage, ClientMessage, ServerControlMessage, ServerMessage } from "../../common/messages";
import { BiMap } from "../../common/lib/BiMap";
import { Connection, Server } from "./Server";
import { log } from "./_tempDebugLog";

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
export class WsServer implements Server<ClientMessage, ServerMessage> {
	#app = express();
	#server = http.createServer(this.#app);
	#wss = new WebSocketServer({ server: this.#server });

	/**
	 * Contrary to what the name suggests, this doesn't keep track of open
	 * WebSocket connections. Rather, it keeps track of authenticated players in
	 * the game.
	 *
	 * An entry in `#activeConnections` represents a client or user, and means:
	 *
	 * - It has a corresponding player in the game.
	 * - It has an ID.
	 *
	 * However, it doesn't guarantee that it actually has an open connection. It's
	 * possible its client has disconnected. When it reconnects, it will tell the
	 * server that it is reconnecting with its existing ID, and the entry will be
	 * updated to have the new WebSocket object.
	 *
	 * New connections also have to talk to the server before getting an entry
	 * here. They have to say that they are new, and the server will generate and
	 * give the client its ID.
	 */
	#playerConnections = new BiMap<string, WebSocket>();
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
	}).then(() => log("First connection. Simulation begins"));

	constructor(game: Game) {
		this.#app.use(express.static(path.join(__dirname, "..", "public")));

		this.#game = game;

		this.#app.get("/", (_req, res) => {
			res.sendFile(path.join(__dirname, "../public/index.html"));
		});

		this.#wss.on("connection", this.#handleNewConnection);
	}

	// #createConnection(ws: WebSocket): Connection<ServerMessage | ServerControlMessage> {
	// 	const id = [...crypto.getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");

	// 	this.#playerConnections.set(id, ws);

	// 	return {
	// 		id,
	// 		send(message) {
	// 			ws.send(JSON.stringify(message));
	// 		},
	// 	};
	// }

	#getConnection(ws: WebSocket): Connection<ServerMessage | ServerControlMessage> | null {
		const id = this.#playerConnections.revGet(ws);
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

	#handleNewConnection = (ws: WebSocket) => {
		this.#unhangServer();

		ws.on("message", (rawData) => {
			this.#handleMessage(ws, rawData);
		});

		ws.on("close", () => {
			const wsId = this.#playerConnections.revGet(ws);
			if (!wsId) return;

			log(`Player ${wsId.slice(0, 6)} disconnected`);

			this.#game.handlePlayerDisconnect(wsId);

			// Give players a while to reconnect
			this.#disconnectTimeouts.set(
				wsId,
				setTimeout(() => {
					this.#deleteConnection(wsId);
					log(`Player ${wsId.slice(0, 6)} discarded`);
				}, RECONNECT_TIMEOUT),
			);

			if (this.#wss.clients.size === 0) {
				log("Server idle, simulation paused");
				this.hasConnection = new Promise<void>((resolve) => {
					this.#unhangServer = resolve;
				}).then(() => log("Simulation resumes"));
			}
		});
	};

	#deleteConnection(id: string) {
		this.#playerConnections.delete(id);
	}

	#handleMessage(ws: WebSocket, rawData: unknown): void {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ClientMessage | ClientControlMessage;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		switch (data.type) {
			case "join":
				if (typeof data.id !== "string") return;

				console.log(`Player ${data.id} attempting to connect`);

				// True if this player is a reconnecting player (so they have an old ws)
				const oldWs = this.#playerConnections.get(data.id);
				let id = data.id;
				if (oldWs) {
					log(`Player ${id.slice(0, 6)} reconnected`);

					// They already sent `join` before. what a bad boy😈. lets do nothing about it
					if (oldWs === ws) return;

					// Reconnecting while the old connection is still live should kill the old connection
					// closing a closed ws is a no-op
					oldWs.close();
				} else {
					// New player (or they reconnected with an invalid ID; we treat them like a new player)
					// Generate a new ID
					id = [...getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");
					log(`New player ${id.slice(0, 6)}`);
				}

				// Create mapping from the new ID to the WebSocket that is currently alive that belongs to that ID
				this.#playerConnections.set(id, ws);

				const connection = this.#getConnection(ws);
				if (!connection) {
					throw new ReferenceError(
						"For some reason, the new WebSocket connection was not successfully registered into playerConnections",
					);
				}

				// Tell the game that they joined
				this.#game.handlePlayerJoin(connection, data.name);

				console.log(`Player ${id} joined!`);
				// Ok we believe u 🥰 you are the client you say you are
				connection.send({
					type: "join-response",
					id,
				});

				// Don't remove id from list because player reconnected
				// (does nothing if player is new)
				clearTimeout(this.#disconnectTimeouts.get(data.id));
				return;
		}

		// If the client hasn't been assigned an id, they are rude. do not respond 🧐
		const connection = this.#getConnection(ws);
		if (!connection) return;

		this.#game.handleMessage(data, connection);
	}
	broadcast(message: ServerMessage): void {
		for (const ws of this.#wss.clients) {
			ws.send(JSON.stringify(message));
		}
	}

	_debugGetConnectionCount(): number {
		return this.#wss.clients.size;
	}
	_debugGetPlayerCount(): number {
		return this.#playerConnections.size;
	}
	_debugGetActivePlayerCount(): number {
		return Array.from(this.#playerConnections.entries()).filter(([, ws]) => ws.readyState === WebSocket.OPEN).length;
	}

	listen(port: number): void {
		this.#server.listen(port);
		console.log(`Listening on http://localhost:${port}/`);
	}
}
