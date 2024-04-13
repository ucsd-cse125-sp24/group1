import { Material } from "../materials/Material";
import { Geometry } from "./Geometry";

/**
 * A geometry that doesn't have any attributes. Instead, the vertex information
 * are hard-coded in the shader.
 */
export class HardCodedGeometry extends Geometry {
	vertices: number;

	/**
	 * @param vertices Number of times to call the vertex shader.
	 */
	constructor(material: Material, vertices: number) {
		super(material);
		this.vertices = vertices;
	}

	draw() {
		const gl = this.material.engine.gl;
		gl.drawArrays(gl.TRIANGLES, 0, this.vertices);
	}
}
