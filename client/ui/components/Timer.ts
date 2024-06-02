import { EntireGameState } from "../../../common/messages";
import { elem } from "../elem";
import styles from "./Timer.module.css";

export class Timer {
	#left = elem("span", { className: styles.left });
	#right = elem("span", { className: styles.right });
	element = elem("div", {
		classes: [styles.timer, styles.hide],
		contents: [this.#left, elem("span", { className: styles.colon, textContent: ":" }), this.#right],
	});
	targetTime: number | null = null;

	renderTime() {
		if (this.targetTime === null) {
			return;
		}
		const secondsLeft = (this.targetTime - Date.now()) / 1000;
		if (secondsLeft >= 0) {
			const minutes = Math.floor(secondsLeft / 60);
			const seconds = secondsLeft % 60;
			if (secondsLeft < 10) {
				this.#left.textContent = `${Math.floor(seconds)}`;
				this.#right.textContent = Math.floor((seconds % 1) * 100)
					.toString()
					.padStart(2, "0");
				this.element.classList.add(styles.secondsOnly);
			} else {
				this.#left.textContent = `${minutes}`;
				this.#right.textContent = Math.floor(seconds).toString().padStart(2, "0");
				this.element.classList.remove(styles.secondsOnly);
			}
		} else {
			this.#left.textContent = "0";
			this.#right.textContent = "00";
			this.element.classList.add(styles.hide);
		}
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "lobby") {
				this.element.classList.add(styles.hide);
				this.targetTime = null;
			} else {
				this.element.classList.remove(styles.hide);
				this.targetTime = state.stage.endTime;
				this.renderTime();
			}
		}
	}
}
