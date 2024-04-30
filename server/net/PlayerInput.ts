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
			lookDir: [0, 0, 0],
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
			lookDir: [0, 0, 0],
		};
	}

	/**
	 * Called whenever the client sends new data about inputs
	 * @param newData
	 */
	updateInputs(newData: ClientInputs) {
		this.#data.lookDir = newData.lookDir;
		for (let key of Object.keys(this.#data)) {
			if (typeof this.#data[key] !== "boolean") continue;
			// If the button wasn't pressed and now is, then mark the input
			// as pressed for the next server tick regardless of its current value
			if (!this.#data[key] && newData[key]) {
				this.#posedge[key] = true;
			}
			this.#data[key] = newData[key];
		}
	}

	// Don't let players use
	getInputs(): ClientInputs {
		let combined = { ...this.#data };
		for (let key of Object.keys(this.#data)) {
			if (typeof this.#data[key] !== "boolean") continue;
			// If an input was pressed between server ticks, return that the input
			// is pressed regardless of if it is released between server ticks for just that tick
			combined[key] ||= this.#posedge[key];
		}
		return combined;
	}

	// Getting posedge
	getPosedge(): ClientInputs {
		return this.#posedge;
	}

	// This function is called to update the player inputs
	serverTick() {
		for (let key of Object.keys(this.#posedge)) {
			if (typeof this.#data[key] !== "boolean") continue;
			this.#posedge[key] = false;
		}
	}
}
