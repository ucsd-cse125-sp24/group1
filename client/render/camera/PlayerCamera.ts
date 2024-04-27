import { vec3 } from "gl-matrix";
import { Camera } from "./Camera";
import GraphicsEngine from "../engine/GraphicsEngine";
import { InputListener } from "../../net/input";

/** How fast the camera rotates in radians per pixel moved by the mouse */
const ROTATION_RATE: number = (0.5 * Math.PI) / 180;

/**
 * Extends the Camera class to handle looking around as a player.
 */
export class PlayerCamera extends Camera {
	#sensitivity: number = 1;
	#isFree: boolean = false;
	#inputListener: InputListener<string>;
	#inputs: Record<string, boolean>;

	constructor(
		position: vec3,
		orientation: vec3,
		upDir: vec3,
		fovY: number,
		aspectRatio: number,
		nearBound: number,
		farBound: number,
		engine: GraphicsEngine,
	) {
		super(position, orientation, upDir, fovY, aspectRatio, nearBound, farBound, engine);
		this.#checkPointerLock();
		this.#inputs = {};
		this.#inputListener = new InputListener({
			reset: () => ({ right: false, left: false, up: false, down: false, backward: false, forward: false }),
			handleKey: (key) => {
				switch (key) {
					case "KeyW":
						return "forward";
					case "KeyA":
						return "left";
					case "KeyS":
						return "backward";
					case "KeyD":
						return "right";
					case "Space":
						return "up";
					case "ShiftLeft":
						return "down";
				}
				return null;
			},
			handleInputs: (inputs) => {
				this.#inputs = inputs;
			},
		});
	}

	setFree(isFree: boolean) {
		this.#isFree = isFree;
		if (isFree) {
			this.#inputListener.listen();
		} else {
			this.#inputListener.disconnect();
		}
	}

	listen(): void {
		document.addEventListener("pointerlockchange", this.#checkPointerLock);

		const canvas = this._engine.gl.canvas;
		if (canvas instanceof OffscreenCanvas) {
			// Can't add event listeners to OffscreenCanvas
			return;
		}
		// Add touch support
		type DragState = { pointerId: number; lastX: number; lastY: number };
		let dragState: DragState | null = null;
		canvas.addEventListener("pointerdown", (e) => {
			if (e.pointerType === "touch" && !dragState) {
				dragState = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
				canvas.setPointerCapture(e.pointerId);
			}
		});
		canvas.addEventListener("pointermove", (e) => {
			if (e.pointerId === dragState?.pointerId) {
				const movementX = e.clientX - dragState.lastX;
				const movementY = e.clientY - dragState.lastY;
				this.#handleMouseMove({ movementX, movementY });
				dragState.lastX = e.clientX;
				dragState.lastY = e.clientY;
			}
		});
		const handlePointerEnd = (e: PointerEvent) => {
			if (e.pointerId === dragState?.pointerId) {
				dragState = null;
			}
		};
		canvas.addEventListener("pointerup", handlePointerEnd);
		canvas.addEventListener("pointercancel", handlePointerEnd);
	}

	#checkPointerLock = () => {
		const canvas = this._engine.gl.canvas;
		if (canvas instanceof OffscreenCanvas) {
			// Can't add event listeners to OffscreenCanvas
			return;
		}
		if (document.pointerLockElement === canvas) {
			canvas.addEventListener("mousemove", this.#handleMouseMove);
		} else {
			canvas.removeEventListener("mousemove", this.#handleMouseMove);
		}
	};

	#handleMouseMove = ({ movementX, movementY }: { movementX: number; movementY: number }) => {
		this.setOrientation(
			this._orientation[0] + movementY * this.#sensitivity * ROTATION_RATE,
			this._orientation[1] - movementX * this.#sensitivity * ROTATION_RATE,
		);
	};

	update(): void {
		if (!this.#isFree) {
			return;
		}
		const forward = vec3.fromValues(this._forwardDir[0], 0, this._forwardDir[2]);
		const right = vec3.cross(vec3.create(), forward, this._upDir);
		const translation = vec3.create();
		if (this.#inputs.forward) {
			vec3.add(translation, translation, forward);
		} else if (this.#inputs.backward) {
			vec3.subtract(translation, translation, forward);
		}
		if (this.#inputs.right) {
			vec3.add(translation, translation, right);
		} else if (this.#inputs.left) {
			vec3.subtract(translation, translation, right);
		}
		if (this.#inputs.up) {
			vec3.add(translation, translation, this._upDir);
		} else if (this.#inputs.down) {
			vec3.subtract(translation, translation, this._upDir);
		}
		if (vec3.length(translation) === 0) {
			return;
		}
		vec3.scale(translation, translation, 0.5 / vec3.length(translation));
		this.setPosition(vec3.add(vec3.create(), this._position, translation));
	}
}
