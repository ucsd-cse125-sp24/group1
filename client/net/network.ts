import { ClientMessage, ServerMessage } from "../../common/messages";

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");
const ws = new WebSocket(wsUrl);

ws.addEventListener("open", () => {
	console.log("Connected :D");
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
	}
	return;
}
