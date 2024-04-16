import { ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import { delay } from "../common/lib/delay";
import { TheWorld } from "./physics";
import { SERVER_GAME_TICK } from "../common/constants";
import { Server } from "./net/Server";
import { WebWorker } from "./net/WebWorker";

/**
 * Whether the server is being compiled for the browser. This is set by the
 * `esbuild` bundle options in `package.json`.
 */
declare var BROWSER: boolean;

const server: Server<ClientMessage, ServerMessage> = BROWSER
	? new WebWorker(handleMessage)
	: // In the browser, we don't want to import WsServer
		new (await import("./net/WsServer")).WsServer(handleMessage);


let playerInputs: ClientInputs[] = [];

/**
 * Parses a raw websocket message, and then generates a
 * response to the message if that is needed
 * @param rawData the raw message data to process
 * @returns a ServerMessage
 */
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
		case "client-input":
			playerInputs[0] = data;
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

	while (true) {
		anchor.z = Math.sin(Date.now() / 500) * 5;
		server.broadcast(anchor);
		// receive input from all clients
		if (playerInputs[0].)
		// update game state
		TheWorld.nextTick();
		// send updated state to all clients
		server.broadcast({
			type: "entire-game-state",
			entities: TheWorld.serialize(),
		});
		// wait until end of tick
		// broadcast(wss, )

		await delay(SERVER_GAME_TICK);
	}
})();

server.listen(2345);
