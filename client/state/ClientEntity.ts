import { mat4 } from "gl-matrix";
import { Geometry } from "../render/geometries/Geometry";
import { Material } from "../render/materials/Material";

export class ClientEntity {
	geometry: Geometry;
	material: Material;

	constructor(geometry: Geometry, material: Material) {
		this.geometry = geometry;
		this.material = material;

		geometry.loadAttrib(material);
	}

	draw(view: mat4) {
		const gl = this.material.engine.gl;
		this.material.use();
		gl.uniformMatrix4fv(this.material.uniform("u_view"), false, view);
		gl.uniformMatrix4fv(this.material.uniform("u_model"), false, this.geometry.transform);
		this.geometry.draw();
	}
}
