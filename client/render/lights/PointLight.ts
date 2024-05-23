import { vec3 } from "gl-matrix";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ShadowMapCamera } from "../camera/ShadowMapCamera";
import { ClientEntity } from "../ClientEntity";

export class PointLight {
	color: vec3;
	#shadowCamera: ShadowMapCamera;
	#shadowMapSize = 1024;
	#engine: GraphicsEngine;

	constructor(engine: GraphicsEngine, position: vec3, color: vec3) {
		this.#engine = engine;
		this.color = color;
		this.#shadowCamera = new ShadowMapCamera(position, 0.001, 100, this.#shadowMapSize, engine);
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
