import { EntityModel } from "../../common/messages";

export type Frame = {
	model: EntityModel[];
	duration: number;
};

export class Animation {
	#frames: Frame[];
	#currentFrame: number;
	#duration: number;
	#priority: number;

	constructor(frames: Frame[], priority: number = 0) {
		this.#frames = frames;
		this.#currentFrame = 0;
		this.#priority = priority;
		this.#duration = frames[0].duration;
	}

	getModel = () => this.#frames[this.#currentFrame].model;
	getPriority = () => this.#priority;

	reset() {
		this.#currentFrame = 0;
		this.#duration = this.#frames[0].duration;
	}

	/**
	 * Ticks one off of the duration of the current frame
	 * @returns true if this animation is done
	 */
	tick(): boolean {
		if (this.#duration === 0) {
			this.#currentFrame = (this.#currentFrame + 1) % this.#frames.length;
			this.#duration = this.#frames[this.#currentFrame].duration;
			if (this.#currentFrame === 0) {
				return true;
			}
		}
		this.#duration--;
		return false;
	}
	toString() {
		return `${this.#currentFrame}: ${this.#duration}`;
	}
}

export class Animator {
	#animations: { [key: string]: Animation };
	#currentAnimation: string;
	#idle: EntityModel[];

	#readyToPlay: boolean;

	constructor(animations: { [key: string]: Animation }, idle: EntityModel[]) {
		this.#animations = animations;
		this.#currentAnimation = "";
		this.#readyToPlay = true;
		this.#idle = idle;
	}

	getModel = () => this.#animations[this.#currentAnimation]?.getModel?.() ?? this.#idle;

	tick() {
		// console.log(`Currently Playing: ${this.#currentAnimation} on frame ${this.#animations[this.#currentAnimation]?.toString()}`);
		if (this.#animations[this.#currentAnimation]) {
			this.#readyToPlay = this.#animations[this.#currentAnimation].tick();
			if (this.#readyToPlay) {
				this.#currentAnimation = "";
			}
		}
	}

	play(animationName: string) {
		//console.log(`Playing ${animationName} animation`);
		let current = this.#animations[this.#currentAnimation];
		let toPlay = this.#animations[animationName];

		if (!toPlay) {
			console.error("Trying to play nonexistent animation: ", animationName);
			return;
		}

		// Don't interrupt an animation with a higher or equal priority
		if (toPlay.getPriority() > (current?.getPriority?.() ?? -Infinity) || this.#readyToPlay) {
			// Kindly tell animation to reset its internal state
			current?.reset?.();
			// Set new animation to run
			this.#currentAnimation = animationName;
		}
	}

	cancel(animationName: string) {
		if (this.#currentAnimation === animationName) {
			this.#animations[this.#currentAnimation].reset();
			this.#readyToPlay = true;
			this.#currentAnimation = "";
		}
	}
}
