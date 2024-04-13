import { mat4 } from "gl-matrix";
import GraphicsEngine from "../GraphicsEngine";
import { Material } from "../materials/Material";

export abstract class Geometry {
	engine: GraphicsEngine;
	transform = mat4.create();

	constructor(engine: GraphicsEngine) {
		this.engine = engine;
	}

	abstract loadAttrib(material: Material): void;
	abstract draw(): void;
}
