export type InputListenerOptions<Inputs extends string> = {
	default: Record<Inputs, boolean>;
	keymap: Record<string | number, Inputs>;
	handleInputs: (inputs: Record<Inputs, boolean>) => void;
	/**
	 * To make the listener fire at a set frequency in addition to after every
	 * key press/release, set this number (in ms). If undefined or 0 then the
	 * listener will only fire after key events.
	 */
	period?: number;
};

export class InputListener<Inputs extends string> {
	options: InputListenerOptions<Inputs>;
	#inputs: Record<Inputs, boolean>;
	#intervalID: number = 0;

	constructor(options: InputListenerOptions<Inputs>) {
		this.options = options;
		this.#inputs = { ...options.default };
	}

	#handleInput(key: Inputs | null, pressed: boolean): void {
		// Don't send anything if inputs don't change (e.g. if keydown is fired
		// multiple times while repeating a key)
		if (!key || this.#inputs[key] === pressed) {
			return;
		}
		this.#inputs[key] = pressed;
		this.options.handleInputs(this.#inputs);
	}

	#handleKeydown = (e: KeyboardEvent) => this.#handleInput(this.options.keymap[e.code] ?? null, true);
	#handleKeyup = (e: KeyboardEvent) => this.#handleInput(this.options.keymap[e.code] ?? null, false);
	#handleMousedown = (e: MouseEvent) => this.#handleInput(this.options.keymap[e.button] ?? null, true);
	#handleMouseup = (e: MouseEvent) => this.#handleInput(this.options.keymap[e.button] ?? null, false);

	/** When the user leaves the page, unpress all keys  */
	#handleBlur = () => {
		this.#inputs = { ...this.options.default };
		this.options.handleInputs(this.#inputs);
	};

	listen() {
		window.addEventListener("keydown", this.#handleKeydown);
		window.addEventListener("keyup", this.#handleKeyup);
		window.addEventListener("mousedown", this.#handleMousedown);
		window.addEventListener("mouseup", this.#handleMouseup);
		window.addEventListener("blur", this.#handleBlur);

		if (this.options.period) {
			// setInterval returns a nonzero ID
			this.#intervalID = window.setInterval(() => this.options.handleInputs(this.#inputs), this.options.period);
		}
	}

	disconnect() {
		window.removeEventListener("keydown", this.#handleKeydown);
		window.removeEventListener("keyup", this.#handleKeyup);
		window.removeEventListener("mousedown", this.#handleMousedown);
		window.removeEventListener("mouseup", this.#handleMouseup);
		window.removeEventListener("blur", this.#handleBlur);

		if (this.#intervalID !== 0) {
			window.clearInterval(this.#intervalID);
			this.#intervalID = 0;
		}
	}
}
