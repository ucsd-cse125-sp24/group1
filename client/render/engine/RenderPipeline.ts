import { mat4 } from "gl-matrix";
import filterVertexSource from "../../shaders/filter.vert";
import noOpFilterFragmentSource from "../../shaders/filterNoOp.frag";
import outlineFilterFragmentSource from "../../shaders/outlineFilter.frag";
import sporeFilterFragmentSource from "../../shaders/sporeFilter.frag";
import { ParticleSystem } from "../model/ParticleSystem";
import GraphicsEngine from "./GraphicsEngine";
import { ShaderProgram } from "./ShaderProgram";

export class RenderPipeline {
	#engine: GraphicsEngine;

	#framebuffer: WebGLFramebuffer | null;
	#colorTexture: WebGLTexture | null;
	#filteredTexture: WebGLTexture | null;
	#depthTexture: WebGLTexture | null;
	#textureWidth: number;
	#textureHeight: number;
	#imagePlanePositions: WebGLBuffer | null;
	#imagePlaneTexCoords: WebGLBuffer | null;
	#filters: ShaderProgram[];

	#reticle: ParticleSystem;

	noOpFilter: ShaderProgram;
	outlineFilter: ShaderProgram;
	sporeFilter: ShaderProgram;

	constructor(engine: GraphicsEngine) {
		this.#engine = engine;
		const gl = engine.gl;

		this.#imagePlanePositions = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlanePositions);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
		this.#imagePlaneTexCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlaneTexCoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

		this.#textureWidth = 0;
		this.#textureHeight = 0;
		// Textures will be allocated and bound to framebuffer before first frame
		this.#colorTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
		// Disable mips
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.#filteredTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.#filteredTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.#depthTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.#framebuffer = gl.createFramebuffer();

		this.#filters = [];

		this.noOpFilter = new ShaderProgram(
			engine,
			engine.createProgram(
				engine.createShader("vertex", filterVertexSource, "filter.vert"),
				engine.createShader("fragment", noOpFilterFragmentSource, "filterNoOp.frag"),
			),
		);
		this.outlineFilter = new ShaderProgram(
			engine,
			engine.createProgram(
				engine.createShader("vertex", filterVertexSource, "filter.vert"),
				engine.createShader("fragment", outlineFilterFragmentSource, "outlineFilter.frag"),
			),
		);
		this.sporeFilter = new ShaderProgram(
			engine,
			engine.createProgram(
				engine.createShader("vertex", filterVertexSource, "filter.vert"),
				engine.createShader("fragment", sporeFilterFragmentSource, "sporeFilter.frag"),
			),
		);

		this.#reticle = new ParticleSystem(engine, 1, Number.POSITIVE_INFINITY, 1, {
			size: 20,
			color: [1, 1, 1],
			mass: 0,
			initialPosition: [0, 0, -0.5],
			initialVelocity: [0, 0, 0],
			ttl: Number.POSITIVE_INFINITY,
		});
		this.#reticle.enable();
	}

	pushFilter(filter: ShaderProgram): void {
		this.#filters.push(filter);
	}

	popFilter(): void {
		this.#filters.pop();
	}

	startRender(): void {
		const gl = this.#engine.gl;

		// Reallocate textures if canvas size has changed
		if (gl.canvas.width !== this.#textureWidth || gl.canvas.height !== this.#textureHeight) {
			this.resizeTextures(gl.canvas.width, gl.canvas.height);
			this.#textureWidth = gl.canvas.width;
			this.#textureHeight = gl.canvas.height;
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.#colorTexture, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.#depthTexture, 0);
	}

	stopRender(): void {
		const gl = this.#engine.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	resizeTextures(width: number, height: number): void {
		const gl = this.#engine.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		gl.bindTexture(gl.TEXTURE_2D, this.#filteredTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	draw(): void {
		if (this.#filters.length === 0) {
			throw new Error("Trying to use RenderPipeline with no shader steps.");
		}

		const gl = this.#engine.gl;

		// Use the framebuffer to apply each filter in succession, drawing from
		// colorTexture to filteredTexture then swapping the two textures
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
		for (let i = 0; i < this.#filters.length - 1; i++) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.#filteredTexture, 0);
			this.#drawToPlane(i);
			const temp = this.#colorTexture;
			this.#colorTexture = this.#filteredTexture;
			this.#filteredTexture = temp;
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Final draw to canvas
		this.#drawToPlane(this.#filters.length - 1);
		this.#reticle.shader.use();
		gl.uniformMatrix4fv(this.#reticle.shader.uniform("u_view"), false, mat4.create());
		gl.uniformMatrix4fv(this.#reticle.shader.uniform("u_model"), false, mat4.create());
		this.#reticle.draw([mat4.create()]);
	}

	#drawToPlane(filterIndex: number): void {
		const gl = this.#engine.gl;
		const filter = this.#filters[filterIndex];
		this.#engine.clear();
		filter.use();
		// Set uniforms
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture);
		gl.uniform1i(filter.uniform("u_texture_color"), 0);
		gl.uniform1i(filter.uniform("u_texture_depth"), 1);
		// Set up screen-filling plane
		const positionAttribLoc = filter.attrib("a_position");
		const texCoordAttribLoc = filter.attrib("a_texcoord");
		gl.enableVertexAttribArray(positionAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlanePositions);
		gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlaneTexCoords);
		gl.vertexAttribPointer(texCoordAttribLoc, 2, gl.FLOAT, false, 0, 0);
		// Draw plane
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		// Clean up
		gl.disableVertexAttribArray(positionAttribLoc);
		gl.disableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
