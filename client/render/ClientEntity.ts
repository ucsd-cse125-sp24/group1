import { mat4 } from "gl-matrix";
import { Geometry } from "./geometries/Geometry";
import { SerializedCollider, SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./GraphicsEngine";

export class ClientEntity {
	geometry: Geometry;
	transform: mat4;
	colliders: SerializedCollider[];

	constructor(geometry: Geometry, transform = mat4.create(), colliders: SerializedCollider[] = []) {
		this.geometry = geometry;
		this.transform = transform;
		this.colliders = colliders;
	}

	draw(view: mat4) {
		const engine = this.geometry.material.engine;
		this.geometry.material.use();
		engine.gl.uniformMatrix4fv(this.geometry.material.uniform("u_view"), false, view);
		engine.gl.uniformMatrix4fv(this.geometry.material.uniform("u_model"), false, this.transform);
		this.geometry.draw();
		engine.checkError();
	}

	drawWireframe() {
		// Assumes that the wireframe material is in use and the view uniform is set
		const engine = this.geometry.material.engine;
		for (const collider of this.colliders) {
			const scale =
				collider.type === "box"
					? mat4.fromScaling(mat4.create(), collider.size)
					: collider.type === "plane"
						? mat4.create()
						: mat4.fromScaling(mat4.create(), [...collider.size, 0]);
			engine.gl.uniformMatrix4fv(
				engine.wireframeBox.material.uniform("u_model"),
				false,
				mat4.multiply(scale, this.transform, scale),
			);
			if (collider.type === "box") {
				engine.gl.uniform1i(engine.wireframeBox.material.uniform("u_shape"), 1);
				engine.wireframeBox.draw();
			} else if (collider.type === "plane") {
				engine.gl.uniform1i(engine.wireframeBox.material.uniform("u_shape"), 2);
				engine.wireframePlane.draw();
			} else if (collider.type === "square") {
				engine.gl.uniform1i(engine.wireframeBox.material.uniform("u_shape"), 3);
				engine.wireframePlane.draw();
			}
			engine.checkError();
		}
	}

	static from(engine: GraphicsEngine, entity: SerializedEntity): ClientEntity {
		const transform = mat4.fromRotationTranslation(mat4.create(), entity.quaternion, entity.position);
		return new ClientEntity(engine.tempGeometry, transform, entity.colliders);
	}
}
