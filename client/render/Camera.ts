import { mat4, vec3, vec4 } from "gl-matrix";
import GraphicsEngine from "./GraphicsEngine";

/** How fast the camera rotates in radians per pixel moved by the mouse */
const DEFAULT_ROTATION_RATE: number = (0.5 * Math.PI) / 180;

/**
 * Computes the projection and view matrix for the vertex shaders to use based
 * on the camera's position and rotation.
 */
class Camera {
	#position: vec3;
	#forwardDir: vec3;
	#upDir: vec3;
	#fovY: number;
	#aspectRatio: number;
	#nearBound: number;
	#farBound: number;
	#sensitivity: number = 1 * DEFAULT_ROTATION_RATE;
	#engine: GraphicsEngine;

	constructor(
		position: vec3,
		forwardDir: vec3,
		upDir: vec3,
		fovY: number,
		aspectRatio: number,
		nearBound: number,
		farBound: number,
		engine: GraphicsEngine,
	) {
		this.#position = position;
		this.#forwardDir = forwardDir;
		this.#upDir = upDir;
		this.#fovY = fovY;
		this.#aspectRatio = aspectRatio;
		this.#nearBound = nearBound;
		this.#farBound = farBound;
		this.#engine = engine;
		this.#checkPointerLock();
	}

	get forward() {
		return this.#forwardDir;
	}

	set position(newValue: vec3) {
		this.#position = newValue;
	}

	set aspectRatio(newValue: number) {
		this.#aspectRatio = newValue;
	}

	listen(): void {
		document.addEventListener("pointerlockchange", this.#checkPointerLock);
	}

	#checkPointerLock = () => {
		if (document.pointerLockElement === this.#engine.gl.canvas) {
			document.addEventListener("mousemove", this.#handleMouseMove);
		} else {
			document.removeEventListener("mousemove", this.#handleMouseMove);
		}
	};

	#handleMouseMove = (event: MouseEvent) => {
		const { movementX, movementY } = event;
		const rightDir = vec3.cross(vec3.create(), this.#forwardDir, this.#upDir);
		const rotateVertical = mat4.fromRotation(mat4.create(), -movementY * this.#sensitivity, rightDir);
		const rotateHorizontal = mat4.fromYRotation(mat4.create(), -movementX * this.#sensitivity);
		const transform = mat4.multiply(mat4.create(), rotateHorizontal, rotateVertical);
		const newForwardDir = vec4.fromValues(this.#forwardDir[0], this.#forwardDir[1], this.#forwardDir[2], 0);
		vec4.transformMat4(newForwardDir, newForwardDir, transform);
		vec3.set(this.#forwardDir, newForwardDir[0], newForwardDir[1], newForwardDir[2]);
		vec3.normalize(this.#forwardDir, this.#forwardDir);
	};

	getViewProjectionMatrix(): mat4 {
		const lookAt = mat4.lookAt(
			mat4.create(),
			this.#position,
			vec3.add(vec3.create(), this.#position, this.#forwardDir),
			this.#upDir,
		);
		const perspective = mat4.perspective(mat4.create(), this.#fovY, this.#aspectRatio, this.#nearBound, this.#farBound);
		return mat4.multiply(mat4.create(), perspective, lookAt);
	}
}

export default Camera;
