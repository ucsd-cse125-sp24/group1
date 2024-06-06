import { vec3 } from "gl-matrix";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ShadowMapCamera } from "../camera/ShadowMapCamera";
import { ClientEntity } from "../ClientEntity";

/**
 * Up to 8 lights allowed by the gltf.frag shader
 *
 * Color is in HSV. H and S in [0, 1]
 */
export class PointLight {
	color: vec3;
	falloff: number;
	#shadowCamera: ShadowMapCamera;
	#shadowMapSize = 1024;
	#engine: GraphicsEngine;
	willMove: boolean;
	#lastLocation = vec3.create();

	constructor(engine: GraphicsEngine, position: vec3, color: vec3, falloff: number, willMove: boolean) {
		this.#engine = engine;
		this.color = color;
		this.falloff = falloff;
		this.#shadowCamera = new ShadowMapCamera(
			position,
			engine.LIGHT_NEAR,
			engine.LIGHT_FAR,
			this.#shadowMapSize,
			engine,
			willMove,
		);
		this.willMove = willMove;
	}

	get position(): vec3 {
		return this.#shadowCamera.getPosition();
	}

	set position(position: vec3) {
		this.#shadowCamera.setPosition(position);
	}

	/**
	 * Returns true if the light may move (`willMove` is true) or it has moved.
	 */
	shouldRecastShadows(): boolean {
		return this.willMove || this.#lastLocation.join("\n") !== this.position.join("\n");
	}

	renderShadowMap(entities: ClientEntity[]): void {
		this.#shadowCamera.renderShadowMap(entities);
		this.#lastLocation = this.position;
	}

	getShadowMap(): WebGLTexture {
		return this.#shadowCamera.getShadowMap();
	}
}
