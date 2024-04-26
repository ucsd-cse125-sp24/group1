import { vec3 } from "gl-matrix";
import { expect } from "../../../common/lib/expect";
import { Material } from "../materials/Material";
import { Geometry } from "./Geometry";
import texture from "../../../assets/test-texture.png";
import { loadImage } from "../../lib/loadImage";

const textureLoaded = loadImage(texture);

export class particleGeometry extends Geometry {
	#VAO: WebGLVertexArrayObject[];
	#texture: WebGLTexture;
	tFeedback: WebGLTransformFeedback[];
	totalParticles: number;
	startTime = Date.now();
	vaoCurrent: number;
	constructor(material: Material, size: vec3) {
		super(material);

		const gl = material.engine.gl;

		const dx = size[0] / 2,
			dy = size[1] / 2,
			dz = size[2] / 2;

		const aPos = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		const aVel = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
		const aAge = new Float32Array([-9000, -9000, -9000, -9000]); //sinceStart, starts at 0, utime - age needs to be negative so the two cancel out and makes it a possitive, so time0 + age > life can happen.
		const aLife = new Float32Array([8000, 5000, 3000, 7000]);

		var aVao = [
			gl.createVertexArray() ?? expect("Failed to create VAO position buffer"),
			gl.createVertexArray() ?? expect("Failed to create VAO position buffer"),
		];
		var aTFB = [
			gl.createTransformFeedback() ?? expect("Failed to create VAO position buffer"),
			gl.createTransformFeedback() ?? expect("Failed to create VAO position buffer"),
		];

		this.#VAO = aVao;
		this.tFeedback = aTFB;
		this.totalParticles = aLife.length;

		for (var i = 0; i < aVao.length; i++) {
			gl.bindVertexArray(this.#VAO[i]);

			const VBO_positions = gl.createBuffer() ?? expect("Failed to create VAO position buffer");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_positions);
			gl.bufferData(gl.ARRAY_BUFFER, aPos, gl.STREAM_COPY);
			gl.vertexAttribPointer(material.attrib("a_position"), 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(material.attrib("a_position"));

			const VBO_velocity = gl.createBuffer() ?? expect("Failed to create VAO normal buffer");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_velocity);
			gl.bufferData(gl.ARRAY_BUFFER, aVel, gl.STREAM_COPY);
			gl.vertexAttribPointer(material.attrib("a_velocity"), 1, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(material.attrib("a_velocity"));

			const VBO_age = gl.createBuffer() ?? expect("Failed to create VAO texcoord buffer");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_age);
			gl.bufferData(gl.ARRAY_BUFFER, aAge, gl.STREAM_COPY);
			gl.vertexAttribPointer(material.attrib("a_age"), 1, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(material.attrib("a_age"));

			const VBO_life = gl.createBuffer() ?? expect("Failed to create VAO texcoord buffer");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_life);
			gl.bufferData(gl.ARRAY_BUFFER, aLife, gl.STREAM_COPY);
			gl.vertexAttribPointer(material.attrib("a_life"), 1, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(material.attrib("a_life"));

			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, aTFB[i]);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, VBO_positions);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, VBO_velocity);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, VBO_age);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 3, VBO_life);

			gl.bindVertexArray(null);
		}

		this.#texture = gl.createTexture() ?? expect("Failed to create texture");
		gl.bindTexture(gl.TEXTURE_2D, this.#texture);
		// Temporarily use blue pixel while image loads
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		textureLoaded.then((image) => {
			gl.bindTexture(gl.TEXTURE_2D, this.#texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.generateMipmap(gl.TEXTURE_2D);
		});
		this.vaoCurrent = 0;
	}

	draw() {
		const gl = this.material.engine.gl;
		// gl.bindVertexArray(this.#VAO);
		// gl.uniform1f(this.material.uniform("u_time"), Date.now() - this.startTime);
		// gl.drawArrays(gl.POINTS, 0, 4);

		// this.material.engine.checkError();
		var idx = (this.vaoCurrent + 1) % 2; //Alternate between the VAOs
		var vaoSource = this.#VAO[this.vaoCurrent];
		var tfeedback = this.tFeedback[idx];

		gl.bindVertexArray(vaoSource);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tfeedback);

		gl.uniform1f(this.material.uniform("u_time"), Date.now() - this.startTime);

		gl.beginTransformFeedback(gl.POINTS);
		gl.drawArrays(gl.POINTS, 0, this.totalParticles);
		gl.endTransformFeedback();

		this.vaoCurrent = idx; //Alternate between the VAOs

		this.material.engine.checkError();

		// var ctx = gl.ctx;

		// var idx = (this.vaoCurrent + 1) % 2; //Alternate between the VAOs
		// var vaoSource = this.vao[ this.vaoCurrent ];
		// var tfeedback = this.tFeedback[ idx ];

		// gl.ctx.bindVertexArray(vaoSource);
		// gl.ctx.bindTransformFeedback(gl.ctx.TRANSFORM_FEEDBACK,tfeedback);

		// this.material.shader.setUniforms("u_time",Fungi.sinceStart);

		// gl.ctx.beginTransformFeedback(gl.ctx.POINTS);
		// gl.ctx.drawArrays(gl.ctx.POINTS, 0, this.totalParticles);
		// gl.ctx.endTransformFeedback();

		// this.vaoCurrent = idx; //Alternate between the VAOs
	}
}
