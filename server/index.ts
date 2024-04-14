import express from "express";
import http from "http";
import path, { dirname } from "path";
import { WebSocketServer, RawData } from "ws";
import { ClientMessage, ServerMessage } from "../common/messages";
import { fileURLToPath } from "url";
import { delay } from "../common/lib/delay";
import { TheWorld } from "./physics";
import { SERVER_GAME_TICK } from "../common/constants";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public/index.html"));
});

wss.on("connection", (ws) => {
	ws.on("message", (rawData) => {
		console.log(rawData);
		const response = handleMessage(rawData);
		if (response) {
			ws.send(JSON.stringify(response));
		}
	});
});

function broadcast(wss: WebSocketServer, message: ServerMessage) {
	for (const ws of wss.clients) {
		ws.send(JSON.stringify(message));
	}
}

/**
 * Parses a raw websocket message, and then generates a
 * response to the message if that is needed
 * @param rawData the raw message data to process
 * @returns a ServerMessage
 */
function handleMessage(rawData: RawData): ServerMessage | undefined {
	const stringData = Array.isArray(rawData) ? rawData.join("") : rawData.toString();

	let data: ClientMessage;
	try {
		data = JSON.parse(stringData);
	} catch {
		console.warn("Non-JSON message: ", stringData);
		return;
	}

	switch (data.type) {
		case "ping":
			return {
				type: "pong",
			};
		case "pong":
			return {
				type: "ping",
			};
		case "client-input":
			console.log(data);
			break;
	}
	return;
}

(async () => {
	let anchor: ServerMessage = {
		type: "CUBEEEEE",
		x: 0,
		y: 0,
		z: 0,
	};
	let w = new TheWorld({ gravity: [0, -9.82, 0] });
	while (true) {
		anchor.z = Math.sin(Date.now() / 500) * 5;
		broadcast(wss, anchor);
		// receive input from all clients
		// update game state
		w.nextTick();
		// send updated state to all clients
		broadcast(wss, {
			type: "entire-game-state",
			entities: w.serialize(),
		});
		// wait until end of tick
		// broadcast(wss, )

		await delay(SERVER_GAME_TICK);
	}
})();

const PORT = 2345;
server.listen(PORT);
console.log(`Listening on http://localhost:${PORT}/`);
