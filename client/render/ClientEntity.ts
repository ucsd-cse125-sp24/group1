import { mat4 } from "gl-matrix";
import { SerializedCollider, SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./engine/GraphicsEngine";
import { Model } from "./model/Model";

/**
 * An entity on the client. These entities are deserialized from the server and
 * dictate where to render what models.
 *
 * The client does not handle moving the entities around.
 */
export class ClientEntity {
	engine: GraphicsEngine;
	name: string;
	models: Model[];
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
	visible = true;

	constructor(
		engine: GraphicsEngine,
		name: string,
		model: Model[],
		transform = mat4.create(),
		colliders: SerializedCollider[] = [],
	) {
		this.engine = engine;
		this.name = name;
		this.models = model;
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
		if (!this.visible) {
			return false;
		}
		for (const model of this.models) {
			model.shader.use();
			this.engine.gl.uniformMatrix4fv(model.shader.uniform("u_view"), false, view);
			this.engine.gl.uniformMatrix4fv(model.shader.uniform("u_model"), false, this.transform);
			model.draw();
		}
	}

	/**
	 * Draw the entity's colliders.
	 *
	 * Preconditions:
	 * - The wireframe shader program is in use.
	 * - `u_view` is set.
	 */
	drawWireframe() {
		for (const collider of this.colliders) {
			this.engine.gl.uniformMatrix4fv(
				this.engine.wireframeMaterial.uniform("u_model"),
				false,
				mat4.translate(mat4.create(), this.transform, collider.offset ?? [0, 0, 0]),
			);
			this.engine.drawWireframe(collider);
		}
	}

	/**
	 * Parse a serialized entity object sent from the server into a `ClientEntity`
	 * instance.
	 */
	static from(engine: GraphicsEngine, entity: SerializedEntity): ClientEntity {
		const transform = mat4.fromRotationTranslation(mat4.create(), entity.quaternion, entity.position);
		return new ClientEntity(
			engine,
			entity.name,
			entity.model.map((model) => engine.models[model]),
			transform,
			entity.colliders,
		);
	}
}
