import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import { RoleSelector } from "./RoleSelector";
import { SkinSelector } from "./SkinSelector";
import styles from "./PauseMenu.module.css";

export class PauseMenu {
	#roleSelector = new RoleSelector();
	#skinSelector = new SkinSelector();
	element = elem("div", {
		className: styles.wrapper,
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
}
