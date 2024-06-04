import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import { EntireGameState } from "../../../common/messages";
import { RoleSelector } from "./RoleSelector";
import { SkinSelector } from "./SkinSelector";
import styles from "./PauseMenu.module.css";
import { PlayerList } from "./PlayerList";
import { Options } from "./Options";

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
	#closeOptionsBtn = elem("button", { classes: ["button", styles.closeBtn], textContent: "Close" });
	#closePlayerListBtn = elem("button", { classes: ["button", styles.closeBtn], textContent: "Close" });
	#optionsBtn = elem("button", { classes: ["button", styles.toggleBtn, "trap-clicks"], textContent: "Options" });
	#playerListBtn = elem("button", { classes: ["button", styles.toggleBtn, "trap-clicks"], textContent: "Players" });
	options = new Options();
	element = elem("div", {
		classes: [styles.wrapper, styles.hide, styles.lobby, styles.optionsHidden, styles.playerListHidden],
		contents: [
			elem("div", {
				classes: [styles.optionsAnchor, "trap-clicks"],
				contents: [
					elem("div", {
						classes: [styles.optionsPanel],
						contents: [
							elem("h2", { className: styles.optionsHeader, contents: ["Options", this.#closeOptionsBtn] }),
							...this.options.elements,
						],
					}),
					this.#optionsBtn,
				],
			}),
			elem("div", {
				className: styles.column,
				contents: [
					elem("h2", { className: styles.logo, textContent: "Game Logo" }),
					this.#winnerMessage,
					this.#clickMessage,
					this.#roleSelector.element,
				],
			}),
			elem("div", {
				classes: [styles.playerListAnchor, "trap-clicks"],
				contents: [
					elem("div", {
						classes: [styles.playerList],
						contents: [this.#closePlayerListBtn, this.#playerList.element, this.#skinSelector.element],
					}),
					this.#playerListBtn,
				],
			}),
		],
	});

	listen(connection: Connection): void {
		this.#roleSelector.listen(connection);
		this.#skinSelector.listen(connection);
		this.#playerList.listen(connection);

		this.#optionsBtn.addEventListener("click", () => {
			this.element.classList.toggle(styles.optionsHidden);
		});
		this.#closeOptionsBtn.addEventListener("click", () => {
			this.element.classList.add(styles.optionsHidden);
		});
		this.#playerListBtn.addEventListener("click", () => {
			this.element.classList.toggle(styles.playerListHidden);
		});
		this.#closePlayerListBtn.addEventListener("click", () => {
			this.element.classList.add(styles.playerListHidden);
		});
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

		const role = state.me.role;
		const previousRole = previous?.me.role;
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
