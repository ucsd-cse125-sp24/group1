import { EntireGameState } from "../../../common/messages";
import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import styles from "./RoleSelector.module.css";

export class RoleSelector {
	#selectBossBtn = elem("button", { classes: [styles.button, styles.bossBtn], textContent: "Join team Boss" });
	#selectHeroBtn = elem("button", { classes: [styles.button, styles.heroBtn], textContent: "Join team Heroes" });
	#spectateBtn = elem("button", { classes: [styles.button, styles.spectateBtn], textContent: "Spectate" });
	element = elem("div", {
		classes: [styles.wrapper, styles.hide, "trap-clicks"],
		contents: [
			elem("div", { className: styles.buttonRow, contents: [this.#selectBossBtn, this.#selectHeroBtn] }),
			this.#spectateBtn,
		],
	});

	listen(connection: Connection): void {
		this.#selectBossBtn.addEventListener("click", () => {
			connection.send({ type: "change-role", role: "boss" });
		});
		this.#selectHeroBtn.addEventListener("click", () => {
			connection.send({ type: "change-role", role: "hero" });
		});
		this.#spectateBtn.addEventListener("click", () => {
			connection.send({ type: "change-role", role: "spectator" });
		});
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		const role = state.players.find((player) => player.me)?.role;
		const previousRole = previous?.players.find((player) => player.me)?.role;
		if (role !== previousRole) {
			this.#selectBossBtn.disabled = role === "boss";
			this.#selectHeroBtn.disabled = role === "hero";
			this.#spectateBtn.disabled = role === "spectator";
		}

		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "lobby") {
				this.element.classList.remove(styles.hide);
			} else {
				this.element.classList.add(styles.hide);
			}
		}
	}
}
