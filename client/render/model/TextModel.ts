import { mat4 } from "gl-matrix";
import { ShaderProgram } from "../engine/ShaderProgram";
import GraphicsEngine from "../engine/GraphicsEngine";
import { Texture, createTextTexture } from "../../lib/createTexture";
import { TextModelFont } from "../../../common/messages";
import { Model } from "./Model";

export class TextModel implements Model {
	shader: ShaderProgram;
	#texture: Texture;
	#scale: number;

	constructor(engine: GraphicsEngine, content: string, height: number, resolution: number, font?: TextModelFont) {
		this.shader = engine.textMaterial;
		this.#texture = createTextTexture(engine, content, resolution, font);
		this.#scale = height / resolution;
	}

	draw(models: mat4[]): void {
		const { gl } = this.shader.engine;
		this.shader.engine.bindTexture(0, "2d", this.#texture.texture);
		gl.uniform1i(this.shader.uniform("u_texture"), 0);
		gl.uniform2f(this.shader.uniform("u_size"), this.#texture.width * this.#scale, this.#texture.height * this.#scale);
		gl.disable(gl.CULL_FACE);
		for (const model of models) {
			gl.uniformMatrix4fv(this.shader.uniform("u_model"), false, model);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
			this.shader.engine._drawCalls++;
		}
		gl.enable(gl.CULL_FACE);
	}
}
