import { elem } from "../elem";
import { Attack, EntireGameState, Use } from "../../../common/messages";
import { InputListener } from "../../net/InputListener";
import { Timer } from "./Timer";
import styles from "./GameplayUi.module.css";
import { Health } from "./Health";

type KeyMap<T> = {
	left: T;
	right: T;
	forward: T;
	backward: T;
	attack: T;
	use: T;
};

const attackIcons: Attack[] = [
	"hero:shoot-arrow",
	"crafting-stage:slap-player",
	"combat:damage",
	"disarm-trap",
	"damage-trap",
	"slap-non-player",
	"hit-mini-boss",
];
const attackLabels: Record<Attack, string> = {
	"hero:shoot-arrow": "Shoot",
	"crafting-stage:slap-player": "Slap",
	"combat:damage": "Attack",
	"disarm-trap": "Disarm",
	"damage-trap": "Damage",
	"slap-non-player": "Slap",
	"hit-mini-boss": "Slap",
};

const useIcons: Use[] = [
	"bigboss:shoot-shroom",
	"throw-item",
	"pickup-item",
	"pop-crafter",
	"boss:spore",
	"boss:place-trap",
	"bigboss:",
];
const useLabels: Record<Use, string> = {
	"bigboss:shoot-shroom": "Shroom Blast",
	"throw-item": "Throw",
	"pickup-item": "Pick Up",
	"pop-crafter": "Remove",
	"boss:spore": "Spore",
	"boss:place-trap": "Trap",
	"bigboss:": "Unknown",
	"equip-armor": "Equip",
};

export class GameplayUi {
	timer = new Timer();
	#health = new Health();
	#joystick = elem("div", { className: styles.joystick });
	#attack = elem("button", { classes: [styles.action, styles.attack, styles.hide] });
	#use = elem("button", { classes: [styles.action, styles.use, styles.hide] });
	element = elem("div", {
		classes: [styles.wrapper, styles.hide, styles.desktop],
		contents: [
			this.timer.element,
			elem("div", { className: styles.crosshair, textContent: "+" }),
			this.#health.element,
			elem("button", { classes: [styles.pauseBtn, "mobile-open-pause"], ariaLabel: "Open pause menu" }),
			this.#joystick,
			elem("div", { className: styles.guide, contents: [this.#attack, this.#use] }),
		],
	});

	listen<T extends string>(inputs: InputListener<T>, map: KeyMap<T>) {
		const testPosition = (e: PointerEvent) => {
			const rect = this.#joystick.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;
			inputs.handleInput(map.left, x < 1 / 3);
			inputs.handleInput(map.right, x > 2 / 3);
			inputs.handleInput(map.forward, y < 1 / 3);
			inputs.handleInput(map.backward, y > 2 / 3);
		};
		const handleEnd = (e: PointerEvent) => {
			if (pointerId !== e.pointerId) {
				return;
			}
			pointerId = null;
			inputs.handleInput(map.left, false);
			inputs.handleInput(map.right, false);
			inputs.handleInput(map.forward, false);
			inputs.handleInput(map.backward, false);
		};
		let pointerId: number | null = null;
		this.#joystick.addEventListener("pointerdown", (e) => {
			if (pointerId !== null) {
				return;
			}
			this.#joystick.setPointerCapture(e.pointerId);
			pointerId = e.pointerId;
			testPosition(e);
			e.stopPropagation();
		});
		this.#joystick.addEventListener("pointermove", (e) => {
			if (pointerId === e.pointerId) {
				testPosition(e);
			}
		});
		this.#joystick.addEventListener("pointerup", handleEnd);
		this.#joystick.addEventListener("pointercancel", handleEnd);

		let attackPointerId: number | null = null;
		this.#attack.addEventListener("pointerdown", (e) => {
			if (attackPointerId !== null) {
				return;
			}
			this.#attack.setPointerCapture(e.pointerId);
			attackPointerId = e.pointerId;
			inputs.handleInput(map.attack, true);
			e.stopPropagation();
		});
		const handleAttackEnd = (e: PointerEvent) => {
			if (e.pointerId === attackPointerId) {
				inputs.handleInput(map.attack, false);
				attackPointerId = null;
			}
		};
		this.#attack.addEventListener("pointerup", handleAttackEnd);
		this.#attack.addEventListener("pointercancel", handleAttackEnd);

		let usePointerId: number | null = null;
		this.#use.addEventListener("pointerdown", (e) => {
			if (usePointerId !== null) {
				return;
			}
			this.#use.setPointerCapture(e.pointerId);
			usePointerId = e.pointerId;
			inputs.handleInput(map.use, true);
			e.stopPropagation();
		});
		const handleUseEnd = (e: PointerEvent) => {
			if (e.pointerId === usePointerId) {
				inputs.handleInput(map.use, false);
				usePointerId = null;
			}
		};
		this.#use.addEventListener("pointerup", handleUseEnd);
		this.#use.addEventListener("pointercancel", handleUseEnd);
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.timer.render(state, previous);
		this.#health.render(state, previous);

		if (state.me.attackAction !== previous?.me.attackAction) {
			if (state.me.attackAction) {
				this.#attack.classList.remove(styles.hide);
				this.#attack.textContent = attackLabels[state.me.attackAction] ?? "Mystery";
				this.#attack.style.setProperty("--icon", `${attackIcons.indexOf(state.me.attackAction)}`);
			} else {
				this.#attack.classList.add(styles.hide);
			}
		}
		if (state.me.useAction !== previous?.me.useAction) {
			if (state.me.useAction) {
				this.#use.classList.remove(styles.hide);
				this.#use.textContent = useLabels[state.me.useAction] ?? "Mystery";
				this.#use.style.setProperty("--icon", `${useIcons.indexOf(state.me.useAction)}`);
			} else {
				this.#use.classList.add(styles.hide);
			}
		}
	}

	show() {
		this.element.classList.remove(styles.hide);
	}

	hide() {
		this.element.classList.add(styles.hide);
	}

	showMobile() {
		this.element.classList.remove(styles.desktop);
	}

	hideMobile() {
		this.element.classList.add(styles.desktop);
	}
}
