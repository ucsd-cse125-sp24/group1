import { ShaderProgram } from "../engine/ShaderProgram";

/**
 * A geometry represents a set of vertices and other attributes. It can be
 * designed to only work for a specific material (shader program).
 */
export abstract class Geometry {
	material: ShaderProgram;

	constructor(material: ShaderProgram) {
		this.material = material;
	}

	abstract draw(): void;
}
