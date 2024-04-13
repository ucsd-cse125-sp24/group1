import { vec3 } from "gl-matrix";
import { expect } from "../../../common/lib/expect";
import GraphicsEngine from "../GraphicsEngine";
import { Material } from "../materials/Material";
import { Geometry } from "./Geometry";

export class BoxGeometry extends Geometry {
	VAO: WebGLVertexArrayObject;
	VBO_positions: WebGLBuffer;
	VBO_normals: WebGLBuffer;

	constructor(engine: GraphicsEngine, size: vec3) {
		super(engine);

		const gl = engine.gl;

		const dx = size[0] / 2,
			dy = size[1] / 2,
			dz = size[2] / 2;
		const positions = [
			[-dx, -dy, -dz],
			[-dx, -dy, dz],
			[dx, -dy, dz],
			[dx, -dy, -dz],
			[-dx, dy, -dz],
			[-dx, dy, dz],
			[dx, dy, dz],
			[dx, dy, -dz],
		];
		const normals = [
			[0, -1, 0],
			[-1, 0, 0],
			[0, 0, 1],
			[1, 0, 0],
			[0, 0, -1],
			[0, 1, 0],
		];

		const positionData = [
			// bottom
			positions[0],
			positions[2],
			positions[1],
			positions[0],
			positions[3],
			positions[2],
			// side
			positions[0],
			positions[1],
			positions[5],
			positions[0],
			positions[5],
			positions[4],
			// side
			positions[1],
			positions[2],
			positions[6],
			positions[1],
			positions[6],
			positions[5],
			// side
			positions[2],
			positions[3],
			positions[7],
			positions[2],
			positions[7],
			positions[6],
			// side
			positions[3],
			positions[0],
			positions[4],
			positions[3],
			positions[4],
			positions[7],
			// top
			positions[4],
			positions[5],
			positions[6],
			positions[4],
			positions[6],
			positions[7],
		];
		const normalData = [
			normals[0],
			normals[0],
			normals[0],
			normals[0],
			normals[0],
			normals[0],
			normals[1],
			normals[1],
			normals[1],
			normals[1],
			normals[1],
			normals[1],
			normals[2],
			normals[2],
			normals[2],
			normals[2],
			normals[2],
			normals[2],
			normals[3],
			normals[3],
			normals[3],
			normals[3],
			normals[3],
			normals[3],
			normals[4],
			normals[4],
			normals[4],
			normals[4],
			normals[4],
			normals[4],
			normals[5],
			normals[5],
			normals[5],
			normals[5],
			normals[5],
			normals[5],
		];
		const positionArray = new Float32Array(positionData.flat());
		const normalArray = new Float32Array(normalData.flat());

		this.VAO = gl.createVertexArray() ?? expect("Failed to create VAO");
		gl.bindVertexArray(this.VAO);

		this.VBO_positions = gl.createBuffer() ?? expect("Failed to create VAO position buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO_positions);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

		this.VBO_normals = gl.createBuffer() ?? expect("Failed to create VAO normal buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO_normals);
		gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);
	}

	loadAttrib(material: Material) {
		const gl = this.engine.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO_positions);
		gl.vertexAttribPointer(material.attrib("a_position"), 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(material.attrib("a_position"));

		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO_normals);
		gl.vertexAttribPointer(material.attrib("a_normal"), 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(material.attrib("a_normal"));
	}

	draw() {
		const gl = this.engine.gl;
		gl.bindVertexArray(this.VAO);
		gl.drawArrays(gl.TRIANGLES, 0, 36);
	}
}
