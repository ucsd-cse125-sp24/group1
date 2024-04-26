import { ShaderProgram } from "../engine/ShaderProgram";
import { Geometry } from "./Geometry";

/**
 * A geometry that doesn't have any attributes. Instead, the vertex information
 * are hard-coded in the shader.
 */
export class HardCodedGeometry extends Geometry {
	vertices = 0;

	/**
	 * @param vertices Number of times to call the vertex shader.
	 */
	constructor(material: ShaderProgram) {
		super(material);
	}

	draw() {
		const gl = this.material.engine.gl;
		gl.drawArrays(gl.TRIANGLES, 0, this.vertices);
	}
}
