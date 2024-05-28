import { mat4 } from "gl-matrix";
import { EntityModelObject, SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./engine/GraphicsEngine";
import { Model } from "./model/Model";
import { PointLight } from "./lights/PointLight";
import { EntityId } from "../../server/entities/Entity";
import { ModelWithTransform } from "./model/draw";
import { TextModel } from "./model/TextModel";

/**
 * An entity on the client. These entities are deserialized from the server and
 * dictate where to render what models.
 *
 * The client does not handle moving the entities around.
 */
export class ClientEntity {
	engine: GraphicsEngine;
	models: ModelWithTransform[];
	data?: SerializedEntity;
	/**
	 * A transformation to apply to all the models in the entity. You can think of
	 * it like the anchor position and rotation of the entity.
	 */
	transform: mat4;
	visible = true;
	light?: PointLight;

	constructor(
		engine: GraphicsEngine,
		models: ModelWithTransform[],
		transform = mat4.create(),
		data?: SerializedEntity,
	) {
		this.engine = engine;
		this.models = models;
		this.transform = transform;
		this.data = data;
	}

	/**
	 * Get the entity's models.
	 */
	getModels(ignoreInvisible = false): ModelWithTransform[] {
		if (!ignoreInvisible && !this.visible) {
			return [];
		}
		return this.models.map(({ model, transform }) => ({
			model,
			transform: mat4.mul(mat4.create(), this.transform, transform),
		}));
	}
}

const textModelCache: Record<string, TextModel> = {};

/**
 * Parse a serialized entity object sent from the server into a `ClientEntity`
 * instance.
 */
export function deserialize(engine: GraphicsEngine, entity: SerializedEntity): ClientEntity {
	const transform = mat4.fromRotationTranslation(mat4.create(), entity.quaternion, entity.position);
	return new ClientEntity(
		engine,
		entity.model.map((model) => {
			if (typeof model !== "string" && "text" in model) {
				const { text, offset = [0, 0, 0], rotation = [0, 0, 0, 1], height = 1, resolution = 64, color, font } = model;
				const id = [text, height, resolution, color, font].join("\n");
				textModelCache[id] ??= new TextModel(engine, text, height, resolution, color, font);
				return {
					model: textModelCache[id],
					transform: mat4.fromRotationTranslation(mat4.create(), rotation, offset),
				};
			}
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
		entity,
	);
}
