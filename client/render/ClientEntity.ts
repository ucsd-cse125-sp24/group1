import { mat4 } from "gl-matrix";
import { EntityModelObject, SerializedEntity } from "../../common/messages";
import GraphicsEngine from "./engine/GraphicsEngine";
import { PointLight } from "./lights/PointLight";
import { ModelWithTransform } from "./model/draw";
import { TextModel } from "./model/TextModel";
import { ImageModel } from "./model/ImageModel";

/**
 * An entity on the client. These entities are deserialized from the server and
 * dictate where to render what models.
 *
 * The client does not handle moving the entities around.
 */
export class ClientEntity {
	engine: GraphicsEngine;
	models: ModelWithTransform[];
	data: SerializedEntity;
	/**
	 * A transformation to apply to all the models in the entity. You can think of
	 * it like the anchor position and rotation of the entity.
	 */
	transform: mat4;
	hasCamera = false;

	constructor(engine: GraphicsEngine, models: ModelWithTransform[], transform = mat4.create(), data: SerializedEntity) {
		this.engine = engine;
		this.models = models;
		this.transform = transform;
		this.data = data;
	}

	/**
	 * Get the entity's models.
	 *
	 * @param purpose Determines when to hide the entity:
	 * - If `rendering`, the entity is invisible if `hasCamera` is true.
	 * - If `static-shadows`, the entity is invisible if the entity is mobile
	 *    (`data.isStatic` is false).
	 * - If omitted, the entity is always visible.
	 */
	getModels(purpose?: "rendering" | "static-shadows" | null): ModelWithTransform[] {
		if ((purpose === "rendering" && this.hasCamera) || (purpose === "static-shadows" && !this.data.isStatic)) {
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
		entity.model.map((model): ModelWithTransform => {
			if (typeof model !== "string") {
				if ("text" in model) {
					const { text, offset = [0, 0, 0], rotation = [0, 0, 0, 1], height = 1, resolution = 64, font } = model;
					const id = [text, height, resolution, JSON.stringify(font)].join("\n");
					textModelCache[id] ??= new TextModel(engine, text, height, resolution, font);
					return {
						model: textModelCache[id],
						transform: mat4.fromRotationTranslation(mat4.create(), rotation, offset),
					};
				}
				if ("image" in model) {
					const { image, offset = [0, 0, 0], rotation = [0, 0, 0, 1], height = 1 } = model;
					return {
						model: new ImageModel(engine, engine.images[image], height),
						transform: mat4.fromRotationTranslation(mat4.create(), rotation, offset),
					};
				}
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
				transform: mat4.fromRotationTranslationScale(
					mat4.create(),
					rotation,
					offset,
					Array.isArray(scale) ? scale : [scale, scale, scale],
				),
			};
		}),
		transform,
		entity,
	);
}
