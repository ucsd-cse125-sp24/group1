import { ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import { delay } from "../common/lib/delay";
import { TheWorld } from "./physics";
import { SERVER_GAME_TICK } from "../common/constants";
import { Server } from "./net/Server";
import { WebWorker } from "./net/WebWorker";
import { Game } from "./Game";

/**
 * Whether the server is being compiled for the browser. This is set by the
 * `esbuild` bundle options in `package.json`.
 */
declare var BROWSER: boolean;

// Create a new game with 1 player
const game = new Game(1);

const server: Server<ClientMessage, ServerMessage> = BROWSER
	? new WebWorker(game.handleMessage.bind(game))
	: // In the browser, we don't want to import WsServer
		new (await import("./net/WsServer")).WsServer(game.handleMessage.bind(game));

//what actually runs the game loop
(async () => {
	game.setup();
	while (true) {
		//check time at beginning of gamestep
		let startTimeCheck = Date.now();

		// update game state
		game.updateGameState();

		// send updated state to all clients
		server.broadcast({
			type: "entire-game-state",
			entities: game.serialize(), //the game instead!
			// ... other game data
		});
		// wait until end of tick
		// broadcast(wss, )

		//check time at end of gamestep
		let endTimeCheck = Date.now();

		let delta = endTimeCheck - startTimeCheck;
		//wait until the rest of the tick is complete
		if (delta > SERVER_GAME_TICK) {
			//shit we had a longass tick. Cry ig
		} else {
			await delay(SERVER_GAME_TICK - delta);
		}
	}
})();

server.listen(2345);
