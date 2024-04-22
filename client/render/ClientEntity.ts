import { mat4 } from "gl-matrix";
import { Geometry } from "./geometries/Geometry";
import { SerializedCollider, SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./GraphicsEngine";

/**
 * An entity on the client. These entities are deserialized from the server and
 * dictate where to render what models.
 *
 * The client does not handle moving the entities around.
 */
export class ClientEntity {
	geometry: Geometry;
	/**
	 * A transformation to apply to all the models in the entity. You can think of
	 * it like the anchor position and rotation of the entity.
	 */
	transform: mat4;
	/**
	 * A list of physics engine colliders to draw for debugging purposes. They
	 * aren't used by the client for anything else, so the server may choose to
	 * keep this empty.
	 */
	colliders: SerializedCollider[];

	constructor(geometry: Geometry, transform = mat4.create(), colliders: SerializedCollider[] = []) {
		this.geometry = geometry;
		this.transform = transform;
		this.colliders = colliders;
	}

	/**
	 * Draw the entity's models.
	 * @param view The camera's view and projection matrix.
	 *
	 * TODO: We might want to split up rendering by material so we don't have to
	 * keep switching between materials.
	 */
	draw(view: mat4) {
		const engine = this.geometry.material.engine;
		this.geometry.material.use();
		engine.gl.uniformMatrix4fv(this.geometry.material.uniform("u_view"), false, view);
		engine.gl.uniformMatrix4fv(this.geometry.material.uniform("u_model"), false, this.transform);
		this.geometry.draw();
		engine.checkError();
	}

	/**
	 * Draw the entity's colliders.
	 *
	 * This method assumes that the wireframe material is already in use, and the
	 * camera matrix `u_view` uniform is already set. This is because the same
	 * shader is used to draw all the colliders' wireframes.
	 */
	drawWireframe() {
		const engine = this.geometry.material.engine;
		for (const collider of this.colliders) {
			engine.gl.uniformMatrix4fv(engine.wireframeMaterial.uniform("u_model"), false, this.transform);
			if (collider.type === "box") {
				engine.gl.uniform1i(engine.wireframeMaterial.uniform("u_shape"), 1);
				engine.gl.uniform4f(engine.wireframeMaterial.uniform("u_size"), ...collider.size, 0);
				engine.wireframeGeometry.vertices = 36;
				engine.wireframeGeometry.draw();
			} else if (collider.type === "plane") {
				engine.gl.uniform1i(engine.wireframeMaterial.uniform("u_shape"), 2);
				engine.wireframeGeometry.vertices = 6;
				engine.wireframeGeometry.draw();
			} else if (collider.type === "sphere") {
				engine.gl.uniform1i(engine.wireframeMaterial.uniform("u_shape"), 3);
				engine.gl.uniform4f(
					engine.wireframeMaterial.uniform("u_size"),
					collider.radius,
					collider.radius,
					collider.radius,
					0,
				);
				engine.wireframeGeometry.vertices = 18;
				engine.wireframeGeometry.draw();
			} else if (collider.type === "cylinder") {
				engine.gl.uniform1i(engine.wireframeMaterial.uniform("u_shape"), 4);
				engine.gl.uniform4f(
					engine.wireframeMaterial.uniform("u_size"),
					collider.radiusTop,
					collider.radiusBottom,
					collider.height / 2,
					(2 * Math.PI) / collider.numSegments,
				);
				engine.wireframeGeometry.vertices = 12 + 6 * collider.numSegments;
				engine.wireframeGeometry.draw();
			}
			engine.checkError();
		}
	}

	/**
	 * Parse a serialized entity object sent from the server into a `ClientEntity`
	 * instance.
	 */
	static from(engine: GraphicsEngine, entity: SerializedEntity): ClientEntity {
		const transform = mat4.fromRotationTranslation(mat4.create(), entity.quaternion, entity.position);
		return new ClientEntity(engine.tempGeometry, transform, entity.colliders);
	}
}
