import { EntireGameState } from "../../../common/messages";
import { elem } from "../elem";
import styles from "./PlayerList.module.css";

export class PlayerList {
	#others = elem("div", { className: styles.list });
	element = elem("div", { classes: [styles.wrapper, "trap-clicks"], contents: [this.#others] });

	render(state: EntireGameState, previous?: EntireGameState): void {
		if (JSON.stringify(state.players) !== JSON.stringify(previous?.players)) {
			this.#others.textContent = "";
			for (const player of state.players) {
				// if (player.me) {
				// 	continue;
				// }
				this.#others.append(
					elem("div", {
						classes: [styles.player, styles[`role-${player.role}`], player.online ? null : styles.offline],
						textContent: `${player.name}${player.online ? "" : " (offline)"}`,
					}),
				);
			}
		}
	}
}
