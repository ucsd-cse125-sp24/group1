import { mat4 } from "gl-matrix";
import { ShaderProgram } from "../engine/ShaderProgram";
import { Model } from "./Model";
import GraphicsEngine from "../engine/GraphicsEngine";
import { TextTexture, createTextTexture } from "../../lib/createTextTexture";
import { Vector3 } from "../../../common/commontypes";

export class TextModel implements Model {
	shader: ShaderProgram;
	#texture: TextTexture;
	#scale: number;
	#color: Vector3;

	constructor(
		engine: GraphicsEngine,
		content: string,
		height: number,
		resolution: number,
		color: Vector3 = [1, 1, 1],
		font?: string,
	) {
		this.shader = engine.textMaterial;
		this.#texture = createTextTexture(engine, content, resolution, font);
		this.#scale = height / resolution;
		this.#color = color;
	}

	draw(models: mat4[]): void {
		const { gl } = this.shader.engine;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.#texture.texture);
		gl.uniform1i(this.shader.uniform("u_texture"), 0);
		gl.uniform2f(this.shader.uniform("u_size"), this.#texture.width * this.#scale, this.#texture.height * this.#scale);
		gl.uniform3f(this.shader.uniform("u_color"), ...this.#color);
		gl.disable(gl.CULL_FACE);
		for (const model of models) {
			gl.uniformMatrix4fv(this.shader.uniform("u_model"), false, model);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
		gl.enable(gl.CULL_FACE);
	}
}
