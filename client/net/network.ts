import { ClientMessage, ServerMessage } from "../../common/messages";

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");
const ws = new WebSocket(wsUrl);

const status = document.getElementById("network-status");
if (!status) {
	throw new TypeError("Network status indicator not found");
}
status.textContent = "🤔 Connecting...";

let lastTime = performance.now();
ws.addEventListener("open", () => {
	console.log("Connected :D");
	status.textContent = "✅ Connected";
	lastTime = performance.now();
});

ws.addEventListener("message", (e) => {
	let data: ServerMessage;
	try {
		data = JSON.parse(e.data);
	} catch {
		console.warn("Parsing JSON message failed!");
		console.log(`Received Data: \n${e.data}`);
		return "Oopsie!";
	}

	const response = handleMessage(data);
	if (response) {
		ws.send(JSON.stringify(response));
	}

	const now = performance.now();
	status.textContent = `✅ Connected (${(now - lastTime).toFixed(3)}ms roundtrip)`;
	lastTime = now;
});

ws.addEventListener("error", () => {
	status.textContent = "❌ Failed to connect";
});

function handleMessage(data: ServerMessage): ClientMessage | undefined {
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
