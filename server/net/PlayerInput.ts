import { Vector3 } from "../../common/commontypes";
import { ClientInputs } from "../../common/messages";

export type Keys = Omit<ClientInputs, "lookDir">;

/**
 * Runs `func` on every key and creates an object out of the results. Useful for
 * looping over keys.
 *
 * Mostly exists as a TypeScript hack.
 */
function mapKeys<T>(func: (key: keyof Keys) => T): Record<keyof Keys, T> {
	return {
		forward: func("forward"),
		backward: func("backward"),
		right: func("right"),
		left: func("left"),
		jump: func("jump"),
		attack: func("attack"),
		use: func("use"),
		emote: func("emote"),
	};
}

export class PlayerInput {
	#data = mapKeys(() => false);
	#posedge = mapKeys(() => false);
	#lookDir: Vector3 = [0, 0, 0];

	/**
	 * Called whenever the client sends new data about inputs
	 * @param newData
	 */
	updateInputs(newData: ClientInputs) {
		this.#lookDir = newData.lookDir;
		this.#data = mapKeys((key) => {
			if (!this.#data[key] && newData[key]) {
				this.#posedge[key] = true;
			}
			return newData[key];
		});
	}

	// Don't let players use
	getInputs(): ClientInputs {
		return { ...mapKeys((key) => this.#data[key] || this.#posedge[key]), lookDir: this.#lookDir };
	}

	// Getting posedge
	getPosedge(): Keys {
		return this.#posedge;
	}

	// This function is called to update the player inputs
	serverTick() {
		mapKeys((key) => {
			this.#posedge[key] = false;
		});
	}
}
