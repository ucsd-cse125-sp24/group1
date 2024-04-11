export type InputListenerOptions<Inputs extends string> = {
	reset: () => Record<Inputs, boolean>;
	handleKey: (key: string | number) => Inputs | null;
	handleInputs: (inputs: Record<Inputs, boolean>) => void;
};

export class InputListener<Inputs extends string> {
	options: InputListenerOptions<Inputs>;
	#inputs: Record<Inputs, boolean>;

	constructor(options: InputListenerOptions<Inputs>) {
		this.options = options;
		this.#inputs = options.reset();
	}

	#handleInput(key: Inputs | null, pressed: boolean): void {
		if (!key) {
			return;
		}
		this.#inputs[key] = pressed;
		this.options.handleInputs(this.#inputs);
	}

	#handleKeydown = (e: KeyboardEvent) => this.#handleInput(this.options.handleKey(e.key), true);
	#handleKeyup = (e: KeyboardEvent) => this.#handleInput(this.options.handleKey(e.key), false);
	#handleMousedown = (e: MouseEvent) => this.#handleInput(this.options.handleKey(e.button), true);
	#handleMouseup = (e: MouseEvent) => this.#handleInput(this.options.handleKey(e.button), false);
	/** When the user leaves the page, unpress all keys  */
	#handleBlur = () => {
		this.#inputs = this.options.reset();
		this.options.handleInputs(this.#inputs);
	};

	listen() {
		window.addEventListener("keydown", this.#handleKeydown);
		window.addEventListener("keyup", this.#handleKeyup);
		window.addEventListener("mousedown", this.#handleMousedown);
		window.addEventListener("mouseup", this.#handleMouseup);
		window.addEventListener("blur", this.#handleBlur);
	}

	disconnect() {
		window.removeEventListener("keydown", this.#handleKeydown);
		window.removeEventListener("keyup", this.#handleKeyup);
		window.removeEventListener("mousedown", this.#handleMousedown);
		window.removeEventListener("mouseup", this.#handleMouseup);
		window.removeEventListener("blur", this.#handleBlur);
	}
}
