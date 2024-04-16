import { Server } from "./Server";
import express from "express";
import http from "http";
import path, { dirname } from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class WsServer<ReceiveType, SendType> extends Server<ReceiveType, SendType> {
	#app = express();
	#server = http.createServer(this.#app);
	#wss = new WebSocketServer({ server: this.#server });

	constructor(handleMessage: (data: ReceiveType) => SendType | undefined) {
		super(handleMessage);

		this.#app.use(express.static(path.join(__dirname, "..", "public")));

		this.#app.get("/", (_req, res) => {
			res.sendFile(path.join(__dirname, "../public/index.html"));
		});

		this.#wss.on("connection", (ws) => {
			ws.on("message", (rawData) => {
				console.log(rawData);
				const stringData = Array.isArray(rawData) ? rawData.join("") : rawData.toString();

				let data: ReceiveType;
				try {
					data = JSON.parse(stringData);
				} catch {
					console.warn("Non-JSON message: ", stringData);
					return;
				}

				const response = this.handleMessage(data);
				if (response) {
					ws.send(JSON.stringify(response));
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
