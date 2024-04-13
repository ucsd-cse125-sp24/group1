import { mat4 } from "gl-matrix";
import GraphicsEngine from "../GraphicsEngine";
import { Material } from "../materials/Material";

/**
 * A geometry represents a set of vertices and other attributes. It can be
 * designed to only work for a specific material (shader program).
 */
export abstract class Geometry {
	engine: GraphicsEngine;
	transform = mat4.create();

	constructor(engine: GraphicsEngine) {
		this.engine = engine;
	}

	abstract loadAttrib(material: Material): void;
	abstract draw(): void;
}
