import { elem } from "../elem";
import styles from "./Welcome.module.css";

export type WelcomeOptions = {
	onName: (name: string) => void;
	onRejoin: () => void;
};

export class Welcome {
	#newPlayer = elem("form", {
		className: styles.wrapper,
		action: "javascript:",
		contents: [
			elem("label", {
				className: styles.inputWrapper,
				contents: [
					elem("span", { className: styles.label, textContent: "What's your name?" }),
					elem("input", { className: styles.input, type: "text", name: "name", required: true }),
				],
			}),
			elem("button", { type: "submit", className: styles.button, textContent: "Play" }),
		],
	});
	#rejoinBtn = elem("button", { type: "button", className: styles.button, textContent: "Return to game" });
	#returningPlayerName = elem("span", { textContent: "Player" });
	#returningPlayer = elem("div", {
		className: styles.wrapper,
		contents: [
			elem("h1", {
				contents: [elem("span", { textContent: "Welcome back," }), this.#returningPlayerName],
			}),
			elem("div", {
				contents: [this.#rejoinBtn],
			}),
		],
	});

	options: WelcomeOptions;

	constructor(options: WelcomeOptions) {
		this.options = options;

		this.#newPlayer.addEventListener("submit", () => {
			const form = new FormData(this.#newPlayer);
			const name = form.get("name");
			if (typeof name === "string") {
				this.options.onName(name);
			}
		});
		this.#rejoinBtn.addEventListener("click", () => {
			this.options.onRejoin();
		});
	}

	show(playerName: string | null): this {
		if (playerName) {
			this.#returningPlayerName.textContent = playerName;
			document.body.append(this.#returningPlayer);
		} else {
			document.body.append(this.#newPlayer);
		}
		return this;
	}

	remove() {
		this.#newPlayer.classList.add(styles.hide);
		this.#returningPlayer.classList.add(styles.hide);
		setTimeout(() => {
			this.#newPlayer.remove();
			this.#returningPlayer.remove();
		}, 1000);
	}
}
