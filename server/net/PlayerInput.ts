import { ClientInputs } from "../../common/messages";


// If a button is prressed in during a server tick, it's pressed down


export class PlayerInput {

	#data: ClientInputs;
	#interactCounter: number;
	
	constructor() {
		this.#data = {
			forward: false,
			backward: false,
			right: false,
			left: false,
			jump: false,
			attack: false,
			use: false,
			emote: false
		};
		this.#interactCounter = 0;
	}

	updateInputs(data: ClientInputs) {
		if (data) {
		this.#data = data;
	}
	
	// This function is called to update the player 
	serverTick() {
	}


}