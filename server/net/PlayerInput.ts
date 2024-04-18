import { ClientInputs } from "../../common/messages";

export class PlayerInput {
	#data: ClientInputs;
	#posedge: ClientInputs;

	constructor() {
		this.#data = {
			forward: false,
			backward: false,
			right: false,
			left: false,
			jump: false,
			attack: false,
			use: false,
			emote: false,
		};
		this.#posedge = {
			forward: false,
			backward: false,
			right: false,
			left: false,
			jump: false,
			attack: false,
			use: false,
			emote: false,
		};
	}

	/**
	 * Called whenever the client sends new data about inputs
	 * @param newData
	 */
	updateInputs(newData: ClientInputs) {
		for (let key of Object.keys(this.#data)) {
			if (!this.#data[key] && newData[key]) {
				this.#posedge[key] = true;
			}
		}
	}

	// Don't let players use
	getInputs(): ClientInputs {
		let combined = { ...this.#data };
		for (let key of Object.keys(this.#data)) {
			// If an input was pressed between server ticks, return that the input
			// is pressed regardless of if it is released between server ticks for just that tick
			combined[key] |= this.#posedge[key];
		}
		return combined;
	}

	// This function is called to update the player inputs
	serverTick() {
		for (let key of Object.keys(this.#posedge)) {
			this.#posedge[key] = false;
		}
	}
}
