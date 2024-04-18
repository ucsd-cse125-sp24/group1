/**
 * This manages the entire state of the game. Any gameplay specific elements
 * should be placed into this file or included into this file, and any interactions
 * that affect the state of the game must eventually be guaranteed to pass through
 * this class.
 *
 * This class serves as the ground source of truth for anything concerning the game
 */

import { TheWorld } from "./physics";
import { PlayerInput } from "./net/PlayerInput";
import { ClientInputs } from "../common/messages";

export class Game {
	// Store all of the player inputs, there is just one for now
	#playerInputs: PlayerInput[];

	constructor(numPlayers: number) {
		this.#playerInputs = new Array(numPlayers).fill(0).map((_) => new PlayerInput());
	}

	updatePlayerInputs(playerNum: number, inputs: ClientInputs) {
		this.#playerInputs[playerNum].updateInputs(inputs);
	}

	getPlayerInputs(playerNum: number) {
		return this.#playerInputs[playerNum].getInputs();
	}

	nextTick() {
		TheWorld.nextTick();
		for (let input of this.#playerInputs) {
			input.serverTick();
		}
	}
}
