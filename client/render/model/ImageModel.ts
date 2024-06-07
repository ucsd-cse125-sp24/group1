import { mat4 } from "gl-matrix";
import { ShaderProgram } from "../engine/ShaderProgram";
import GraphicsEngine from "../engine/GraphicsEngine";
import { Texture } from "../../lib/createTexture";
import { Model } from "./Model";

export class ImageModel implements Model {
	shader: ShaderProgram;
	#texture: Texture;
	#height: number;

	constructor(engine: GraphicsEngine, texture: Texture, height: number) {
		this.shader = engine.textMaterial;
		this.#texture = texture;
		this.#height = height;
	}

	draw(models: mat4[]): void {
		const { gl } = this.shader.engine;
		this.shader.engine.bindTexture(0, "2d", this.#texture.texture);
		gl.uniform1i(this.shader.uniform("u_texture"), 0);
		gl.uniform2f(
			this.shader.uniform("u_size"),
			(this.#height / this.#texture.height) * this.#texture.width,
			this.#height,
		);
		gl.disable(gl.CULL_FACE);
		for (const model of models) {
			gl.uniformMatrix4fv(this.shader.uniform("u_model"), false, model);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			this.shader.engine._drawCalls++;
		}
		gl.enable(gl.CULL_FACE);
	}
}
