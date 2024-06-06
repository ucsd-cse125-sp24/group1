import { EntireGameState } from "../../../common/messages";
import { elem } from "../elem";
import styles from "./Health.module.css";

export class Health {
	#count = elem("div", { className: styles.count });
	#crystals = elem("div", { className: styles.crystals });
	element = elem("div", {
		classes: [styles.wrapper, styles.hide],
		contents: [this.#count, this.#crystals],
	});

	render(state: EntireGameState, previous?: EntireGameState): void {
		const health = state.stage.type === "combat" ? state.me.health : 0;
		const previousHealth = previous?.stage.type === "combat" ? previous.me.health : 0;
		if (health !== previousHealth) {
			if (!health) {
				this.element.classList.add(styles.hide);
			} else if (health > 10) {
				this.element.classList.remove(styles.hide);
				this.element.classList.remove(styles.noCount);
				this.#count.textContent = `${health}`;
				this.#crystals.style.setProperty("--health", "1");
			} else {
				this.element.classList.remove(styles.hide);
				this.element.classList.add(styles.noCount);
				this.#crystals.style.setProperty("--health", `${health}`);
			}
		}
	}
}
