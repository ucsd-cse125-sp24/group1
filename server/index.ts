import express from "express";
import http from "http";
import path, { dirname } from "path";
import { WebSocketServer } from "ws";
import { ClientMessage, ServerMessage } from "../common/messages";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public/index.html"));
});

wss.on("connection", (ws) => {
	const response: ServerMessage = {
		type: "ping",
	};
	ws.send(JSON.stringify(response));
	ws.on("message", (rawData) => {
		const stringData = Array.isArray(rawData)
			? rawData.join("")
			: rawData.toString();
		console.log(stringData);
		let data: ClientMessage;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}
		const response = handleMessage(data);
		if (response) {
			ws.send(JSON.stringify(response));
		}
	});
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function broadcast(wss: WebSocketServer, message: ServerMessage) {
	for (const ws of wss.clients) {
		ws.send(JSON.stringify(message));
	}
}

function handleMessage(data: ClientMessage): ServerMessage | undefined {
	switch (data.type) {
		case "ping":
			return {
				type: "pong",
			};
		case "pong":
			return {
				type: "ping",
			};
		case "set-size":
			break;
	}
	return;
}

server.listen(6969);
