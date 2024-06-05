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
	#shadowCamera: ShadowMapCamera;
	#shadowMapSize = 1024;
	#engine: GraphicsEngine;
	readonly willMove: boolean;

	constructor(engine: GraphicsEngine, position: vec3, color: vec3, willMove: boolean) {
		this.#engine = engine;
		this.color = color;
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

	renderShadowMap(entities: ClientEntity[]): void {
		this.#shadowCamera.renderShadowMap(entities);
	}

	getShadowMap(): WebGLTexture {
		return this.#shadowCamera.getShadowMap();
	}
}
