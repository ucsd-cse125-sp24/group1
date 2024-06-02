import { EntireGameState } from "../../../common/messages";
import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import styles from "./SkinSelector.module.css";

export class SkinSelector {
	#startBtn = elem("button", { classes: [styles.startBtn, "start-game-btn"], textContent: "Start game" });
	element = elem("div", {
		classes: [styles.wrapper, styles.hide],
		contents: [elem("p", { textContent: "We recommend playing with 1 Boss and 3 Heroes." }), this.#startBtn],
	});

	listen(connection: Connection): void {
		this.#startBtn.addEventListener("click", () => {
			connection.send({ type: "start-game" });
		});
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "lobby") {
				this.element.classList.remove(styles.hide);
			} else {
				this.element.classList.add(styles.hide);
			}
		}
	}
}
