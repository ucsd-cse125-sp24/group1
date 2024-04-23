import { vec3 } from "gl-matrix";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ShadowMapCamera } from "../camera/ShadowMapCamera";
import { ClientEntity } from "../ClientEntity";

export class PointLight {
	#position: vec3;
	#intensity: vec3;
	#shadowCamera: ShadowMapCamera;
	#shadowMapSize = 1024;
	#engine: GraphicsEngine;

	constructor(engine: GraphicsEngine, position: vec3, intensity: vec3) {
		this.#engine = engine;
		this.#position = position;
		this.#intensity = intensity;
		this.#shadowCamera = new ShadowMapCamera(position, 0.001, 100, this.#shadowMapSize, engine);
	}

	getPosition() {
		return this.#position;
	}

	getIntensity() {
		return this.#intensity;
	}

	renderShadowMap(entities: ClientEntity[]): void {
		this.#shadowCamera.renderShadowMap(entities);
	}

	getShadowMap(): WebGLTexture {
		return this.#shadowCamera.getShadowMap();
	}
}
