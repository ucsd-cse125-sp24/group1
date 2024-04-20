import { vec3 } from "gl-matrix";
import { Camera } from "./Camera";
import GraphicsEngine from "./GraphicsEngine";

/** How fast the camera rotates in radians per pixel moved by the mouse */
const ROTATION_RATE: number = (0.5 * Math.PI) / 180;

/**
 * Extends the Camera class to handle looking around as a player.
 */
export class PlayerCamera extends Camera {
	#sensitivity: number = 1;

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
}
