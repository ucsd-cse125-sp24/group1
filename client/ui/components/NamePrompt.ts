import styles from "./NamePrompt.module.css";
import { elem } from "../elem";
import { logo } from "./Logo";

export class NamePrompt {
	#input = elem("input", { type: "text", className: styles.input, name: "name" });
	#form = elem("form", {
		className: styles.prompt,
		action: "javascript:",
		contents: [
			elem("label", {
				className: styles.inputWrapper,
				contents: [
					elem("span", { className: styles.label, textContent: "Howdy, miner. What's your name?" }),
					this.#input,
				],
			}),
			elem("button", { type: "submit", className: styles.submit, ariaLabel: "Submit" }),
		],
	});
	element = elem("div", {
		classes: [styles.wrapper],
		contents: [logo(), this.#form],
	});

	listen(onName: (name: string) => void) {
		this.#input.focus();

		this.#form.addEventListener("submit", () => {
			const data = new FormData(this.#form);
			const name = data.get("name");
			if (typeof name === "string") {
				onName(name);
			}
		});
	}
}

export async function ensureName(): Promise<string> {
	let name = localStorage.getItem("cse125.2024.g1.options.name");
	if (!name) {
		const prompt = new NamePrompt();
		document.body.append(prompt.element);
		name = await new Promise<string>((resolve) => {
			prompt.listen(resolve);
		});
		prompt.element.remove();
		localStorage.setItem("cse125.2024.g1.options.name", name);
	}
	return name;
}
