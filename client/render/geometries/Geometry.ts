import { Material } from "../materials/Material";

/**
 * A geometry represents a set of vertices and other attributes. It can be
 * designed to only work for a specific material (shader program).
 */
export abstract class Geometry {
	material: Material;

	constructor(material: Material) {
		this.material = material;
	}

	abstract draw(): void;
}
