import { ChangeRole, EntireGameState } from "../../../common/messages";
import { Connection } from "../../net/Connection";
import { elem } from "../elem";
import styles from "./SkinSelector.module.css";

const skins = ["red", "yellow", "green", "blue"] as const;

export class SkinSelector {
	#skinButtons = skins.map((skin) => ({
		skin,
		button: elem("button", { ariaLabel: `Select ${skin} skin`, classes: [styles.skin, styles[`skin-${skin}`]] }),
	}));
	#skinSelector = elem("div", {
		classes: [styles.skins, styles.hide],
		contents: [
			elem("div", { className: styles.skinlabel, textContent: "Change your appearance" }),
			...this.#skinButtons.map(({ button }) => button),
		],
	});
	#startBtn = elem("button", { classes: ["button", styles.startBtn, "start-game-btn"], textContent: "Start game" });
	element = elem("div", {
		classes: [styles.wrapper, styles.hide],
		contents: [
			this.#skinSelector,
			elem("p", { textContent: "We recommend playing with 1 Boss and 3 Heroes." }),
			this.#startBtn,
		],
	});

	listen(connection: Connection): void {
		this.#startBtn.addEventListener("click", () => {
			connection.send({ type: "start-game" });
		});
		for (const { skin, button } of this.#skinButtons) {
			button.addEventListener("click", () => {
				connection.send({ type: "change-role", role: "hero", skin });
			});
		}
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		if (state.stage.type !== previous?.stage.type) {
			if (state.stage.type === "lobby") {
				this.element.classList.remove(styles.hide);
			} else {
				this.element.classList.add(styles.hide);
			}
		}

		const playerCount = [...state.others, state.me].filter((player) => player.role !== "spectator").length;
		const previousPlayerCount =
			previous && [...previous.others, previous.me].filter((player) => player.role !== "spectator").length;
		if (playerCount !== previousPlayerCount) {
			this.#startBtn.disabled = playerCount === 0;
		}

		if (state.me.role !== previous?.me.role) {
			if (state.me.role === "hero") {
				this.#skinSelector.classList.remove(styles.hide);
			} else {
				this.#skinSelector.classList.add(styles.hide);
			}
		}

		const currentModel = state.me.entityId && state.entities[state.me.entityId]?.model[0];
		const previousModel = previous?.me.entityId && previous.entities[previous.me.entityId]?.model[0];
		if (JSON.stringify(currentModel) !== JSON.stringify(previousModel)) {
			const currentSkin =
				typeof currentModel === "string" || !currentModel
					? currentModel ?? null
					: "modelId" in currentModel
						? currentModel.modelId
						: null;
			for (const { skin, button } of this.#skinButtons) {
				button.disabled = currentSkin === `player_${skin}`;
				if (currentSkin === `player_${skin}`) {
					button.classList.add(styles.selected);
				} else {
					button.classList.remove(styles.selected);
				}
			}
		}
	}
}
