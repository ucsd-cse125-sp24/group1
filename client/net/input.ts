import { ClientInputs } from "../../common/messages";
import { send } from "./network";

const resetInputs = (): ClientInputs => ({
	forward: false,
	backward: false,
	right: false,
	left: false,
	jump: false,
	attack: false,
	use: false,
	emote: false,
});

let inputs = resetInputs();

function keyToInput(key: string | number): keyof ClientInputs | null {
	switch (typeof key === "string" ? key.toLowerCase() : key) {
		case "w":
			return "forward";
		case "a":
			return "left";
		case "s":
			return "backward";
		case "d":
			return "right";
		case "space":
			return "jump";
		case "e":
			return "emote";
		case 0: // Left mouse button
			return "attack";
		case 1: // Left mouse button
			return "use";
		default:
			return null;
	}
}

function handleInput(key: keyof ClientInputs | null, pressed: boolean): void {
	if (!key) {
		return;
	}
	inputs[key] = pressed;
	send({ type: "client-input", ...inputs });
}

window.addEventListener("keydown", (e) => {
	handleInput(keyToInput(e.key), true);
});

window.addEventListener("keyup", (e) => {
	handleInput(keyToInput(e.key), false);
});

window.addEventListener("mousedown", (e) => {
	handleInput(keyToInput(e.button), true);
});

window.addEventListener("mouseup", (e) => {
	handleInput(keyToInput(e.button), false);
});

// When the user leaves the page, unpress all keys
window.addEventListener("blur", () => {
	inputs = resetInputs();
	send({ type: "client-input", ...inputs });
});
