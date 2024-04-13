import { mat4 } from "gl-matrix";
import { Geometry } from "./geometries/Geometry";
import { SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./GraphicsEngine";

export class ClientEntity {
	geometry: Geometry;
	transform: mat4;

	constructor(geometry: Geometry, transform = mat4.create()) {
		this.geometry = geometry;
		this.transform = transform;
	}

	draw(view: mat4) {
		const engine = this.geometry.material.engine;
		this.geometry.material.use();
		engine.checkError();
		engine.gl.uniformMatrix4fv(this.geometry.material.uniform("u_view"), false, view);
		engine.checkError();
		engine.gl.uniformMatrix4fv(this.geometry.material.uniform("u_model"), false, this.transform);
		engine.checkError();
		this.geometry.draw();
		engine.checkError();
	}

	drawWireframe() {
		// Assumes that the wireframe material is in use and the view uniform is set
		const engine = this.geometry.material.engine;
		engine.gl.uniformMatrix4fv(engine.wireframeBox.material.uniform("u_model"), false, this.transform);
		engine.checkError();
		engine.wireframeBox.draw();
		engine.checkError();
	}

	static from(engine: GraphicsEngine, entity: SerializedEntity): ClientEntity {
		const transform = mat4.fromRotationTranslation(mat4.create(), entity.quaternion, entity.position);
		return new ClientEntity(engine.tempGeometry, transform);
	}
}
