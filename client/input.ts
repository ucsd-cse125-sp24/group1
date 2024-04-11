import { ClientInputs } from "../common/messages";

let inputs: ClientInputs = {
	forward: false,
	backward: false,
	right: false,
	left: false,
	jump: false,
	attack: false,
	use: false,
	emote: false
};

window.addEventListener("keydown", e => {
	switch(e.key) {
		case "w":
			inputs.forward = true;
		break;
		// TODO
	}
});

window.addEventListener("keyup", e => {
	switch(e.key) {
		//TODO
	}
});