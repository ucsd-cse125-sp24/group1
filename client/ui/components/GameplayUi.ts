import { elem } from "../elem";
import { EntireGameState } from "../../../common/messages";
import { Timer } from "./Timer";
import styles from "./GameplayUi.module.css";

export class GameplayUi {
	timer = new Timer();
	element = elem("div", {
		classes: [styles.wrapper],
		contents: [this.timer.element],
	});

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.timer.render(state, previous);
	}
}
