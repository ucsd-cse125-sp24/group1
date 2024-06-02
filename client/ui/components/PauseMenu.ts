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
	#winner = elem("strong");
	#winnerRest = elem("span");
	#winnerMessage = elem("p", {
		classes: [styles.winnerMessage, styles.hide],
		contents: ["The ", this.#winner, this.#winnerRest],
	});
	element = elem("div", {
		classes: [styles.wrapper, styles.hide, styles.lobby],
		contents: [
			elem("h2", { className: styles.logo, textContent: "Game Logo" }),
			this.#winnerMessage,
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
				if (state.stage.previousWinner) {
					this.#winner.textContent = state.stage.previousWinner === "boss" ? "Boss" : "Heroes";
					this.#winner.className = state.stage.previousWinner === "boss" ? styles.boss : styles.hero;
					this.#winnerRest.textContent = state.stage.previousWinner === "boss" ? " has won!" : " have won!";
					this.#winnerMessage.classList.remove(styles.hide);
				} else {
					this.#winnerMessage.classList.add(styles.hide);
				}
			} else {
				this.element.classList.remove(styles.lobby);
				this.element.classList.add(styles.gaming);
				this.#winnerMessage.classList.add(styles.hide);
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
