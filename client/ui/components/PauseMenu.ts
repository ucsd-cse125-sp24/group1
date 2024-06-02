import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import { RoleSelector } from "./RoleSelector";
import { SkinSelector } from "./SkinSelector";
import styles from "./PauseMenu.module.css";
import { EntireGameState } from "../../../common/messages";

export class PauseMenu {
	#roleSelector = new RoleSelector();
	#skinSelector = new SkinSelector();
	element = elem("div", {
		classes: [styles.wrapper, styles.hide],
		contents: [
			elem("div", { textContent: "Game Name Here" }),
			this.#roleSelector.element,
			elem("div", { className: styles.playerList, contents: [this.#skinSelector.element] }),
		],
	});

	listen(connection: Connection): void {
		this.#roleSelector.listen(connection);
		this.#skinSelector.listen(connection);
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.#roleSelector.render(state, previous);
		this.#skinSelector.render(state, previous);
	}

	show() {
		this.element.classList.remove(styles.hide);
	}

	hide() {
		this.element.classList.add(styles.hide);
	}
}
