import { EntireGameState } from "../../../common/messages";
import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import { NAME_KEY } from "./NamePrompt";
import styles from "./PlayerList.module.css";

export class PlayerList {
	#others = elem("div", { className: styles.list });
	#myRole = elem("div", {});
	#nameInput = elem("input", { className: styles.input, type: "text", name: "name" });
	element = elem("div", {
		classes: [styles.wrapper],
		contents: [elem("div", { className: styles.me, contents: [this.#myRole, this.#nameInput, "(you)"] }), this.#others],
	});

	listen(connection: Connection): void {
		this.#nameInput.addEventListener("change", () => {
			if (this.#nameInput.value.length > 0) {
				connection.send({ type: "change-name", name: this.#nameInput.value });
				localStorage.setItem(NAME_KEY, this.#nameInput.value);
			}
		});
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		const currentPlayers = state.others.map(({ name, role, online }) => ({ name, role, online }));
		const previousPlayers = previous && previous.others.map(({ name, role, online }) => ({ name, role, online }));
		if (JSON.stringify(currentPlayers) !== JSON.stringify(previousPlayers)) {
			this.#others.textContent = "";
			for (const player of currentPlayers) {
				this.#others.append(
					elem("div", {
						classes: [styles.player, player.online ? null : styles.offline],
						contents: [
							elem("div", { classes: [styles.roleIcon, styles[`role-icon-${player.role}`]] }),
							player.name,
							player.online ? "" : elem("span", { className: styles.offlineTag, textContent: "(offline)" }),
						],
					}),
				);
			}
		}

		if (state.me.role !== previous?.me.role) {
			this.#myRole.className = `${styles.roleIcon} ${styles[`role-icon-${state.me.role}`]}`;
		}
		if (state.me.name !== previous?.me.name && state.me.name !== this.#nameInput.value) {
			this.#nameInput.value = state.me.name;
		}
	}
}
