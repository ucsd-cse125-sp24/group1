import { delay } from "../common/lib/delay";
import { SERVER_GAME_TICK } from "../common/constants";
import { Game } from "./Game";
import { WsServer } from "./net/WsServer";
import { log } from "./net/_tempDebugLog";

/**
 * Whether the server is being compiled for the browser. This is set by the
 * `esbuild` bundle options in `package.json`.
 */
declare var BROWSER: boolean;

const game = new Game();

const server = new WsServer(game);

let ticks = 0;
let totalDelta = 0;

//what actually runs the game loop
(async () => {
	log("Server started");
	await game.setup();
	while (true) {
		// If there is no one connected, wait until someone connects
		await server.hasConnection;

		//check time at beginning of gamestep
		let startTimeCheck = Date.now();

		// update game state
		game.updateGameState();

		// send updated state to all clients
		server.broadcast({
			type: "entire-game-state",
			entities: game.serialize(), //the game instead!
			physicsBodies: game.serializePhysicsBodies(),
			// ... other game data
		});
		// wait until end of tick
		// broadcast(wss, )

		//check time at end of gamestep
		let endTimeCheck = Date.now();

		let delta = endTimeCheck - startTimeCheck;
		ticks++;
		totalDelta += delta;
		if (ticks >= 2000) {
			log(
				`${ticks} ticks sampled. Average simulation time: ${(totalDelta / ticks).toFixed(4)}ms per tick. ${server._debugGetConnectionCount()} connection(s), ${server._debugGetActivePlayerCount()} of ${server._debugGetPlayerCount()} player(s) online`,
			);
			ticks = 0;
			totalDelta = 0;
		}
		//wait until the rest of the tick is complete
		if (delta > SERVER_GAME_TICK) {
			//shit we had a longass tick. Cry ig
		} else {
			await delay(SERVER_GAME_TICK - delta);
		}
	}
})();

server.listen(2345);
