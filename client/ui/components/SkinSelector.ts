import { Connection } from "../../net/Connection";
import { elem } from "../elem";

export class SkinSelector {
	#startBtn = elem("button", { textContent: "Start game" });
	element = elem("div", {
		contents: [this.#startBtn],
	});

	listen(connection: Connection): void {
		this.#startBtn.addEventListener("click", () => {
			connection.send({ type: "start-game" });
		});
	}
}
