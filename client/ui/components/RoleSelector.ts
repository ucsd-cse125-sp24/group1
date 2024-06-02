import { Connection } from "../../net/Connection";
import { elem } from "../elem";

export class RoleSelector {
	#selectBossBtn = elem("button", { textContent: "Join boss team" });
	#selectHeroBtn = elem("button", { textContent: "Join hero team" });
	#spectateBtn = elem("button", { textContent: "Spectate" });
	element = elem("div", {
		contents: [this.#selectBossBtn, this.#selectHeroBtn, this.#spectateBtn],
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
}
