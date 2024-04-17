import { mat4, vec3, vec4 } from "gl-matrix";
import GraphicsEngine from "./GraphicsEngine";
import { clamp, modulo } from "../../common/lib/math";

/** How fast the camera rotates in radians per pixel moved by the mouse */
const ROTATION_RATE: number = (0.5 * Math.PI) / 180;

/**
 * Computes the projection and view matrix for the vertex shaders to use based
 * on the camera's position and rotation.
 */
class Camera {
	/** x, y, z coordinates of the eye */
	#position: vec3;
	/**
	 * x, y, z, Euler angle rotations in radians. Should obey these constraints:
	 * - x in [-pi, pi]
	 * - y in [0, 2*pi)
	 * - z = 0
	 */
	#orientation: vec3;
	#forwardDir: vec3;
	#upDir: vec3;
	#fovY: number;
	#aspectRatio: number;
	#nearBound: number;
	#farBound: number;
	#sensitivity: number = 1;
	#engine: GraphicsEngine;

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
		this.#position = position;
		this.#orientation = orientation;
		this.#forwardDir = orientation; // will be recalculated below
		this.#upDir = upDir;
		this.#fovY = fovY;
		this.#aspectRatio = aspectRatio;
		this.#nearBound = nearBound;
		this.#farBound = farBound;
		this.#engine = engine;
		this.setOrientation(orientation[0], orientation[1]);
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
		this.setOrientation(
			this.#orientation[0] + movementY * this.#sensitivity * ROTATION_RATE,
			this.#orientation[1] - movementX * this.#sensitivity * ROTATION_RATE,
		);
	};

	setOrientation(xRot: number, yRot: number): void {
		xRot = clamp(xRot, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
		yRot = modulo(yRot, 2 * Math.PI);
		this.#orientation = vec3.fromValues(xRot, yRot, 0);
		const rotationX = mat4.fromXRotation(mat4.create(), xRot);
		const rotationY = mat4.fromYRotation(mat4.create(), yRot);
		const transform = mat4.multiply(mat4.create(), rotationY, rotationX);
		const newForwardDir = vec4.fromValues(0, 0, 1, 0);
		vec4.transformMat4(newForwardDir, newForwardDir, transform);
		vec3.set(this.#forwardDir, newForwardDir[0], newForwardDir[1], newForwardDir[2]);
		vec3.normalize(this.#forwardDir, this.#forwardDir);
	}

	/**
	 * Computes the matrix representing view and perspective projection, mapping
	 * from world space to clip space.
	 *
	 * TODO: Cache the result somehow so we don't compute the same matrix many
	 * times per frame.
	 */
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
