import { elem } from "../elem";
import { EntireGameState } from "../../../common/messages";
import { Timer } from "./Timer";
import styles from "./GameplayUi.module.css";
import { Health } from "./Health";

export class GameplayUi {
	timer = new Timer();
	#health = new Health();
	element = elem("div", {
		classes: [styles.wrapper, styles.hide],
		contents: [
			this.timer.element,
			elem("div", { className: styles.crosshair, textContent: "+" }),
			this.#health.element,
		],
	});

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.timer.render(state, previous);
		this.#health.render(state, previous);
	}

	show() {
		this.element.classList.remove(styles.hide);
	}

	hide() {
		this.element.classList.add(styles.hide);
	}
}
