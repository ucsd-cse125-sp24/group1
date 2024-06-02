import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import { RoleSelector } from "./RoleSelector";
import { SkinSelector } from "./SkinSelector";
import styles from "./PauseMenu.module.css";
import { EntireGameState } from "../../../common/messages";
import { PlayerList } from "./PlayerList";

export class PauseMenu {
	#roleSelector = new RoleSelector();
	#skinSelector = new SkinSelector();
	#clickMessage = elem("div", { className: styles.clickMessage });
	#playerList = new PlayerList();
	element = elem("div", {
		classes: [styles.wrapper, styles.hide, styles.lobby],
		contents: [
			elem("div", { className: styles.logo, textContent: "Game Logo" }),
			this.#clickMessage,
			this.#roleSelector.element,
			elem("div", {
				classes: [styles.playerList, "trap-clicks"],
				contents: [this.#playerList.element, this.#skinSelector.element],
			}),
		],
	});

	listen(connection: Connection): void {
		this.#roleSelector.listen(connection);
		this.#skinSelector.listen(connection);
		this.#playerList.listen(connection);
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.#roleSelector.render(state, previous);
		this.#skinSelector.render(state, previous);
		this.#playerList.render(state, previous);
		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "lobby") {
				this.element.classList.add(styles.lobby);
				this.element.classList.remove(styles.gaming);
			} else {
				this.element.classList.remove(styles.lobby);
				this.element.classList.add(styles.gaming);
			}
		}

		const role = state.players.find((player) => player.me)?.role;
		const previousRole = previous?.players.find((player) => player.me)?.role;
		if (role !== previousRole) {
			this.#clickMessage.textContent = role === "spectator" ? "Click here to spectate" : "Click here to play";
		}
	}

	show() {
		this.element.classList.remove(styles.hide);
	}

	hide() {
		this.element.classList.add(styles.hide);
	}
}
