import { mat4, vec3 } from "gl-matrix";
import { Camera } from "./Camera";
import GraphicsEngine from "./GraphicsEngine";
import { ClientEntity } from "./ClientEntity";

const CUBE_FORWARD_DIR = [
	vec3.fromValues(1, 0, 0),
	vec3.fromValues(-1, 0, 0),
	vec3.fromValues(0, 1, 0),
	vec3.fromValues(0, -1, 0),
	vec3.fromValues(0, 0, 1),
	vec3.fromValues(0, 0, -1),
];

const CUBE_UP_DIR = [
	vec3.fromValues(0, -1, 0),
	vec3.fromValues(0, -1, 0),
	vec3.fromValues(0, 0, 1),
	vec3.fromValues(0, 0, -1),
	vec3.fromValues(0, -1, 0),
	vec3.fromValues(0, -1, 0),
];

/**
 * Extends the Camera class to render a cubic shadow/depth map.
 */
export class ShadowMapCamera extends Camera {
	#perspective: mat4;
	#textureSize: number;
	#shadowMap: WebGLTexture;
	#framebuffer: WebGLFramebuffer;

	constructor(position: vec3, nearBound: number, farBound: number, size: number, engine: GraphicsEngine) {
		super(position, vec3.fromValues(1, 0, 0), vec3.fromValues(0, 1, 0), Math.PI / 4, 1, nearBound, farBound, engine);
		this.#perspective = mat4.perspective(mat4.create(), this._fovY, this._aspectRatio, this._nearBound, this._farBound);
		this.#textureSize = size;
		const gl = engine.gl;
		const texture = gl.createTexture();
		const colorTexture = gl.createTexture();
		if (!texture || !colorTexture) {
			throw new Error("Failed to create shadow map texture.");
		}
		this.#shadowMap = texture;
		const framebuffer = gl.createFramebuffer();
		if (!framebuffer) {
			throw new Error("Failed to create shadow map framebuffer.");
		}
		this.#framebuffer = framebuffer;

		// Initialize cube map textures
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.#shadowMap);
		for (let side = 0; side < 6; side++) {
			gl.texImage2D(
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + side,
				0,
				gl.DEPTH_COMPONENT32F,
				this.#textureSize,
				this.#textureSize,
				0,
				gl.DEPTH_COMPONENT,
				gl.FLOAT,
				null,
			);
		}
		// Don't use mips
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		// Bind color attachment - even though we only care about depth, some
		// devices still require the framebuffer to have a color attachment
		gl.bindTexture(gl.TEXTURE_2D, colorTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	getViewProjectionMatrix(): mat4 {
		const lookAt = mat4.lookAt(
			mat4.create(),
			this._position,
			vec3.add(vec3.create(), this._position, this._forwardDir),
			this._upDir,
		);
		return mat4.multiply(mat4.create(), this.#perspective, lookAt);
	}

	renderShadowMap(entities: ClientEntity[]): void {
		const gl = this._engine.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
		gl.viewport(0, 0, this.#textureSize, this.#textureSize);
		for (let side = 0; side < 6; side++) {
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.DEPTH_ATTACHMENT,
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + side,
				this.#shadowMap,
				0,
			);
			gl.clearColor(1, 1, 1, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			this._forwardDir = CUBE_FORWARD_DIR[side];
			this._upDir = CUBE_UP_DIR[side];
			const view = this.getViewProjectionMatrix();
			for (const entity of entities) {
				entity.draw(view);
			}
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	getShadowMap(): WebGLTexture {
		return this.#shadowMap;
	}
}
