import { EntireGameState } from "../../../common/messages";
import { elem } from "../elem";
import styles from "./Timer.module.css";

export class Timer {
	#craftStage = elem("div", { className: styles.stage, textContent: "Craft" });
	#combatStage = elem("div", { className: styles.stage, textContent: "Combat" });
	#left = elem("span", { className: styles.left });
	#right = elem("span", { className: styles.right });
	#bar = elem("div", { className: styles.bar });
	#timer = elem("div", {
		classes: [styles.timerWrapper, styles.hide],
		contents: [
			this.#bar,
			elem("div", {
				className: styles.timer,
				contents: [this.#left, elem("span", { className: styles.colon, textContent: ":" }), this.#right],
			}),
		],
	});
	element = elem("div", {
		classes: [styles.wrapper],
		contents: [
			elem("div", {
				className: styles.stages,
				contents: [this.#craftStage, this.#combatStage],
			}),
			this.#timer,
		],
	});
	#duration: number = 0;
	#targetTime: number | null = null;

	renderTime() {
		if (this.#targetTime === null) {
			return;
		}
		const secondsLeft = (this.#targetTime - Date.now()) / 1000;
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
			this.#bar.style.setProperty("--percentage", `${(secondsLeft / (this.#duration / 1000)) * 100}%`);
		} else {
			this.#left.textContent = "0";
			this.#right.textContent = "00";
			this.#bar.style.setProperty("--percentage", "0");
			this.#timer.classList.add(styles.hide);
		}
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "lobby" || state.stage.type === "gameover") {
				this.#timer.classList.add(styles.hide);
				this.#targetTime = null;
			} else {
				this.#timer.classList.remove(styles.hide);
				this.#duration = state.stage.endTime - state.stage.startTime;
				this.#targetTime = state.stage.endTime;
				this.renderTime();
			}

			if (state.stage.type === "crafting") {
				this.#craftStage.classList.add(styles.current);
			} else {
				this.#craftStage.classList.remove(styles.current);
			}
			if (state.stage.type === "combat") {
				this.#combatStage.classList.add(styles.current);
			} else {
				this.#combatStage.classList.remove(styles.current);
			}
		}
	}
}
