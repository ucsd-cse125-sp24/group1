import { mat4 } from "gl-matrix";
import { groupBy } from "../../../common/lib/groupBy";
import { Model } from "./Model";

export type ModelWithTransform = {
	model: Model;
	transform: mat4;
};

/**
 * Efficiently draws models one shader at a time. Identical models are batched
 * together into a single `Model.draw` call.
 */
export function drawModels(view: mat4, models: ModelWithTransform[]): void {
	const shaders = groupBy(models, ({ model }) => model.shader);
	for (const [shader, allModels] of shaders) {
		shader.use();
		shader.engine.gl.uniformMatrix4fv(shader.uniform("u_view"), false, view);

		const models = groupBy(allModels, ({ model }) => model);
		for (const [model, transforms] of models) {
			model.draw(
				transforms.map(({ transform }) => transform),
				view,
			);
		}
	}
}
