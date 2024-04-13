import { vec3 } from "gl-matrix";
import { expect } from "../../../common/lib/expect";
import { Material } from "../materials/Material";
import { Geometry } from "./Geometry";
import texture from "../../../assets/test-texture.png";

const textureLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
	const image = new Image();
	image.src = texture;
	image.addEventListener("load", () => resolve(image));
	image.addEventListener("error", reject);
});

export class BoxGeometry extends Geometry {
	VAO: WebGLVertexArrayObject;

	constructor(material: Material, size: vec3) {
		super(material);

		const gl = material.engine.gl;

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
			positions[3],
			positions[2],
			positions[0],
			positions[2],
			positions[1],
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
		const texcoordArray = new Float32Array(
			Array.from({ length: 6 }).flatMap(() =>
				[
					[0, 0],
					[0, 1],
					[1, 1],
					[0, 0],
					[1, 1],
					[1, 0],
				].flat(),
			),
		);

		this.VAO = gl.createVertexArray() ?? expect("Failed to create VAO");
		gl.bindVertexArray(this.VAO);

		const VBO_positions = gl.createBuffer() ?? expect("Failed to create VAO position buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, VBO_positions);
		gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(material.attrib("a_position"), 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(material.attrib("a_position"));

		const VBO_normals = gl.createBuffer() ?? expect("Failed to create VAO normal buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, VBO_normals);
		gl.bufferData(gl.ARRAY_BUFFER, normalArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(material.attrib("a_normal"), 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(material.attrib("a_normal"));

		const VBO_texcoords = gl.createBuffer() ?? expect("Failed to create VAO texcoord buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, VBO_texcoords);
		gl.bufferData(gl.ARRAY_BUFFER, texcoordArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(material.attrib("a_texcoord"), 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(material.attrib("a_texcoord"));

		const texture = gl.createTexture() ?? expect("Failed to create texture");
		gl.bindTexture(gl.TEXTURE_2D, texture);
		// Temporarily use blue pixel while image loads
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		textureLoaded.then((image) => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.generateMipmap(gl.TEXTURE_2D);
		});
	}

	draw() {
		const gl = this.material.engine.gl;
		gl.bindVertexArray(this.VAO);
		gl.uniform1i(this.material.uniform("u_texture"), 0);
		gl.drawArrays(gl.TRIANGLES, 0, 36);
	}
}
