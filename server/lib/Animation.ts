import { EntityModel } from "../../common/messages";

export type Frame = {
	model: EntityModel[];
	duration: number;
};

export class Animation {
	#frames: Frame[];
	#currentFrame: number;
	#duration: number;

	constructor(frames: Frame[]) {
		this.#frames = frames;
		this.#currentFrame = 0;
		this.#duration = frames[0].duration;
	}

	getModel = () => this.#frames[this.#currentFrame].model;

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
		return `Animation on frame ${this.#currentFrame} remaining duration: ${this.#duration}`;
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
		if (this.#animations[this.#currentAnimation]) {
			this.#readyToPlay = this.#animations[this.#currentAnimation].tick();
			if (this.#readyToPlay) {
				this.#currentAnimation = "";
			}
		}
	}

	play(animationName: string) {
		console.log(`Playing ${animationName} animation`);
		if (this.#readyToPlay) {
			if (!this.#animations[animationName]) {
				console.error("Trying to play nonexistent animation: ", animationName);
				return;
			}
			this.#currentAnimation = animationName;
		}
	}
}
