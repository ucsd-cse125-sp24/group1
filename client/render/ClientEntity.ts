import { mat4 } from "gl-matrix";
import { EntityModelObject, SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./engine/GraphicsEngine";
import { Model } from "./model/Model";
import { PointLight } from "./lights/PointLight";

export type ModelWithTransform = {
	model: Model;
	transform: mat4;
};

/**
 * An entity on the client. These entities are deserialized from the server and
 * dictate where to render what models.
 *
 * The client does not handle moving the entities around.
 */
export class ClientEntity {
	engine: GraphicsEngine;
	name: string;
	models: ModelWithTransform[];
	/**
	 * A transformation to apply to all the models in the entity. You can think of
	 * it like the anchor position and rotation of the entity.
	 */
	transform: mat4;
	visible = true;
	light?: PointLight;

	constructor(engine: GraphicsEngine, name: string, models: ModelWithTransform[], transform = mat4.create()) {
		this.engine = engine;
		this.name = name;
		this.models = models;
		this.transform = transform;
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
		for (const { model, transform } of this.models) {
			model.shader.use();
			this.engine.gl.uniformMatrix4fv(model.shader.uniform("u_view"), false, view);
			this.engine.gl.uniformMatrix4fv(
				model.shader.uniform("u_model"),
				false,
				mat4.mul(mat4.create(), this.transform, transform),
			);
			model.draw();
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
			entity.model.map((model) => {
				const {
					modelId,
					offset = [0, 0, 0],
					rotation = [0, 0, 0, 1],
					scale = 1,
				}: EntityModelObject = typeof model === "string" ? { modelId: model } : model;
				if (!engine.models[modelId]) {
					throw new ReferenceError(`Model '${modelId}' doesn't exist.`);
				}
				return {
					model: engine.models[modelId],
					transform: mat4.fromRotationTranslationScale(mat4.create(), rotation, offset, [scale, scale, scale]),
				};
			}),
			transform,
		);
	}
}
