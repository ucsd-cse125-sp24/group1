function easeInOutCubic(t: number): number {
	// t < 0.5: (2t)^3 / 2 = 4t^3
	// t > 0.5: ((2t - 2)^3 + 2) / 2 = (2t - 2)^3 / 2 + 1
	//        = (8t^3 - 24t^2 + 24t - 8) / 2 + 1 = 4t^3 - 12t^2 + 12t - 4 + 1
	//        = ((4 * t - 12) * t + 12) * t - 3
	return t < 0.5 ? 4 * t * t * t : ((4 * t - 12) * t + 12) * t - 3;
}

/**
 * Allows for smooth transitions between values.
 */
export class Transition {
	/** The number to transition to. */
	#target: number;
	/** The amount to transition by. Equal to `new - old`. */
	#delta = 0;
	/** The time when the transition started, in milliseconds. */
	#transitionStartTime = 0;
	/** The length of the duration, in milliseconds. */
	#duration: number;

	constructor(defaultTarget: number, duration = 1000) {
		this.#target = defaultTarget;
		this.#duration = duration;
	}

	#getT(time: number): number {
		const t = (time - this.#transitionStartTime) / this.#duration;
		if (t < 0) {
			return 0;
		} else if (t > 1) {
			return 1;
		} else {
			return t;
		}
	}

	setValueInstant(value: number): void {
		this.#target = value;
		this.#delta = 0;
	}

	setTarget(target: number, time = Date.now()): void {
		if (target === this.#target) {
			return;
		}
		this.#delta = target - this.#target;
		this.#target = target;
		this.#transitionStartTime = time;
	}

	getValue(time = Date.now()): number {
		return this.#target - this.#delta * (1 - easeInOutCubic(this.#getT(time)));
	}
}
