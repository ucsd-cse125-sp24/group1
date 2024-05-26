import { mat4 } from "gl-matrix";
import { ShaderProgram } from "../engine/ShaderProgram";

export interface Model {
	/**
	 * The shader program that the model expects to be used. This way, we can
	 * render models one shader at a time to avoid unnecessarily switching between
	 * them.
	 */
	shader: ShaderProgram;

	/**
	 * Draw the models. If instancing is supported, you can do that here, but if
	 * not, you can just loop over each matrix in `models` and draw each
	 * individually.
	 *
	 * Preconditions:
	 * - The shader program is in use.
	 * - `u_view` is set.
	 */
	draw(models: mat4[], view: mat4): void;
}
