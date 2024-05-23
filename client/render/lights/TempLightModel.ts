import { vec3 } from "gl-matrix";
import { ShaderProgram } from "../engine/ShaderProgram";
import { Model } from "../model/Model";

export class TempLightModel implements Model {
	shader: ShaderProgram;
	color: vec3;

	constructor(shader: ShaderProgram, color: vec3) {
		this.shader = shader;
		this.color = color;
	}

	draw() {
		const gl = this.shader.engine.gl;
		gl.uniform3fv(this.shader.uniform("u_color"), this.color);
		gl.drawArrays(gl.TRIANGLES, 0, 36);
	}
}
