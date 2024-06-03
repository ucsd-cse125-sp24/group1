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
		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "combat") {
				this.element.classList.remove(styles.hide);
			} else {
				this.element.classList.add(styles.hide);
			}
		}

		const health = state.me.health;
		const previousHealth = previous?.me.health;
		if (state.stage.type === "combat" && health !== previousHealth) {
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
