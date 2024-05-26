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
	 * Draw the model.
	 *
	 * Preconditions:
	 * - The shader program is in use.
	 * - `u_view` and `u_model` are set. There's no need to use set them yourself.
	 */
	draw(model: mat4, view: mat4): void;
}
