import { Server, ServerHandlers } from "./Server";
import express from "express";
import http from "http";
import path, { dirname } from "path";
import { WebSocket, WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * An implementation of `Server` that starts a WebSocket server.
 */
export class WsServer<ReceiveType, SendType> extends Server<ReceiveType, SendType, WebSocket> {
	#app = express();
	#server = http.createServer(this.#app);
	#wss = new WebSocketServer({ server: this.#server });

	#handleNewConnection = () => {};
	hasConnection = new Promise<void>((resolve) => {
		this.#handleNewConnection = resolve;
	});

	constructor(handlers?: ServerHandlers<ReceiveType, SendType>) {
		super(handlers);

		this.#app.use(express.static(path.join(__dirname, "..", "public")));

		this.#app.get("/", (_req, res) => {
			res.sendFile(path.join(__dirname, "../public/index.html"));
		});

		this.#wss.on("connection", (ws) => {
			this.#handleNewConnection();
			for (const message of this.handleOpen(ws)) {
				ws.send(JSON.stringify(message));
			}
			ws.on("message", (rawData) => {
				const response = this.handleMessage(rawData, ws);
				if (response) {
					ws.send(JSON.stringify(response));
				}
			});
			ws.on("close", () => {
				if (this.#wss.clients.size === 0) {
					this.hasConnection = new Promise<void>((resolve) => {
						this.#handleNewConnection = resolve;
					});
				}
			});
		});
	}

	broadcast(message: SendType): void {
		for (const ws of this.#wss.clients) {
			ws.send(JSON.stringify(message));
		}
	}

	listen(port: number): void {
		this.#server.listen(port);
		console.log(`Listening on http://localhost:${port}/`);
	}
}
