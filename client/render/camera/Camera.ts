import { mat4, vec3, vec4 } from "gl-matrix";
import GraphicsEngine from "../engine/GraphicsEngine";
import { clamp, modulo } from "../../../common/lib/math";

/**
 * Computes the projection and view matrix for the vertex shaders to use based
 * on the camera's position and rotation.
 */
export class Camera {
	/** x, y, z coordinates of the eye */
	_position: vec3;
	/**
	 * x, y, z, Euler angle rotations in radians. Should obey these constraints:
	 * - x in [-pi, pi]
	 * - y in [0, 2*pi)
	 * - z = 0
	 */
	_orientation: vec3;
	_forwardDir: vec3;
	_upDir: vec3;
	_fovY: number;
	_aspectRatio: number;
	_nearBound: number;
	_farBound: number;
	_engine: GraphicsEngine;

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
		this._position = position;
		this._orientation = orientation;
		this._forwardDir = orientation; // will be recalculated below
		this._upDir = upDir;
		this._fovY = fovY;
		this._aspectRatio = aspectRatio;
		this._nearBound = nearBound;
		this._farBound = farBound;
		this._engine = engine;
		this.setOrientation(orientation[0], orientation[1]);
	}

	getForwardDir() {
		return this._forwardDir;
	}

	setForwardDir(fwd: vec3) {
		this._forwardDir = fwd;
	}

	setUpDir(up: vec3) {
		this._upDir = up;
	}

	getPosition() {
		return this._position;
	}

	setPosition(pos: vec3) {
		this._position = pos;
	}

	// HACK: Firefox doesn't support positionX/Y/Z
	moveAudioListener(listener: AudioListener | Omit<AudioListener, "positionX">) {
		if ("positionX" in listener) {
			[listener.positionX.value, listener.positionY.value, listener.positionZ.value] = this._position;
			[listener.forwardX.value, listener.forwardY.value, listener.forwardZ.value] = this._forwardDir;
		} else {
			listener.setPosition(this._position[0], this._position[1], this._position[2]);
			listener.setOrientation(this._forwardDir[0], this._forwardDir[1], this._forwardDir[2], 0, 0, 1);
		}
	}

	setAspectRatio(aspect: number) {
		this._aspectRatio = aspect;
	}

	setOrientation(xRot: number, yRot: number): void {
		xRot = clamp(xRot, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
		yRot = modulo(yRot, 2 * Math.PI);
		this._orientation = vec3.fromValues(xRot, yRot, 0);
		const rotationX = mat4.fromXRotation(mat4.create(), xRot);
		const rotationY = mat4.fromYRotation(mat4.create(), yRot);
		const transform = mat4.multiply(mat4.create(), rotationY, rotationX);
		const newForwardDir = vec4.fromValues(0, 0, 1, 0);
		vec4.transformMat4(newForwardDir, newForwardDir, transform);
		vec3.set(this._forwardDir, newForwardDir[0], newForwardDir[1], newForwardDir[2]);
		vec3.normalize(this._forwardDir, this._forwardDir);
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
			this._position,
			vec3.add(vec3.create(), this._position, this._forwardDir),
			this._upDir,
		);
		const perspective = mat4.perspective(mat4.create(), this._fovY, this._aspectRatio, this._nearBound, this._farBound);
		return mat4.multiply(mat4.create(), perspective, lookAt);
	}
}
