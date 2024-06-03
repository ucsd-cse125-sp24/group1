import { EntireGameState } from "../../../common/messages";
import { Connection } from "../../net/Connection";
import { elem } from "../elem";
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
			}
		});
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		if (JSON.stringify(state.players) !== JSON.stringify(previous?.players)) {
			this.#others.textContent = "";
			for (const player of state.players) {
				if (player.me) {
					continue;
				}
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

			const me = state.players.find((player) => player.me);
			const previousMe = previous?.players.find((player) => player.me);
			if (!me) {
				return;
			}
			if (me.role !== previousMe?.role) {
				this.#myRole.className = `${styles.roleIcon} ${styles[`role-icon-${me.role}`]}`;
			}
			if (me.name !== previousMe?.name && me.name !== this.#nameInput.value) {
				this.#nameInput.value = me.name;
			}
		}
	}
}
