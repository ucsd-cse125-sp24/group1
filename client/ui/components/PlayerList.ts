import { EntireGameState } from "../../../common/messages";
import { elem } from "../elem";
import styles from "./PlayerList.module.css";

export class PlayerList {
	element = elem("div", { className: styles.wrapper });

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.element.textContent = state.players.map((player) => player.name).join("\n");
	}
}
