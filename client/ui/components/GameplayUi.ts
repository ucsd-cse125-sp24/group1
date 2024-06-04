import { elem } from "../elem";
import { EntireGameState } from "../../../common/messages";
import { Timer } from "./Timer";
import styles from "./GameplayUi.module.css";
import { Health } from "./Health";
import { InputListener } from "../../net/InputListener";

type KeyMap<T> = {
	left: T;
	right: T;
	forward: T;
	backward: T;
};

export class GameplayUi {
	timer = new Timer();
	#health = new Health();
	#joystick = elem("div", { className: styles.joystick });
	element = elem("div", {
		classes: [styles.wrapper, styles.hide, styles.desktop],
		contents: [
			this.timer.element,
			elem("div", { className: styles.crosshair, textContent: "+" }),
			this.#health.element,
			elem("button", { classes: [styles.pauseBtn, "mobile-open-pause"], ariaLabel: "Open pause menu" }),
			this.#joystick,
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
	}

	render(state: EntireGameState, previous?: EntireGameState): void {
		this.timer.render(state, previous);
		this.#health.render(state, previous);
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
