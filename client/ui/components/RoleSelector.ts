import { EntireGameState } from "../../../common/messages";
import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import styles from "./RoleSelector.module.css";

export class RoleSelector {
	#selectBossBtn = elem("button", { classes: ["button", styles.bossBtn], textContent: "Join team Boss" });
	#selectHeroBtn = elem("button", { classes: ["button", styles.heroBtn], textContent: "Join team Heroes" });
	#spectateBtn = elem("button", { classes: ["button", styles.spectateBtn], textContent: "Spectate" });
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
		const role = state.me.role;
		const previousRole = previous?.me.role;
		if (role !== previousRole) {
			this.#selectBossBtn.disabled = role === "boss";
			this.#selectHeroBtn.disabled = role === "hero";
			this.#spectateBtn.disabled = role === "spectator";
		}

		if (state.stage.type !== previous?.stage.type) {
			// Can change this to `=== "lobby"` if we don't want to allow joining the
			// game late
			if (state.stage.type !== "gameover") {
				this.element.classList.remove(styles.hide);
			} else {
				this.element.classList.add(styles.hide);
			}
		}
	}
}
