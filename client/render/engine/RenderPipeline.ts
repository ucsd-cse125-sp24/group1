import filterVertexSource from "../../shaders/filter.vert";
import noOpFilterFragmentSource from "../../shaders/filterNoOp.frag";
import GraphicsEngine from "./GraphicsEngine";
import { ShaderProgram } from "./ShaderProgram";

export type Filter = {
	shader: ShaderProgram;
	/** Default: true */
	enabled?: boolean;
	/**
	 * Strength of the filter. Some filters may use this. If 0, the filter is
	 * skipped. Default: 1
	 */
	strength?: number;
};

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
	filters: Filter[];

	noOpFilter: ShaderProgram;

	constructor(engine: GraphicsEngine, filters: Filter[] = []) {
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

		this.filters = filters;

		this.noOpFilter = new ShaderProgram(
			engine,
			engine.createProgram(
				engine.createShader("vertex", filterVertexSource, "filter.vert"),
				engine.createShader("fragment", noOpFilterFragmentSource, "filterNoOp.frag"),
			),
		);
	}

	#getFilters(): Filter[] {
		const filters = this.filters.filter((filter) => (filter.enabled ?? true) && filter.strength !== 0);
		return filters.length > 0 ? filters : [{ shader: this.noOpFilter }];
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
		const gl = this.#engine.gl;
		const filters = this.#getFilters();

		// Use the framebuffer to apply each filter in succession, drawing from
		// colorTexture to filteredTexture then swapping the two textures
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
		for (const filter of filters) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.#filteredTexture, 0);
			this.#drawToPlane(filter);
			const temp = this.#colorTexture;
			this.#colorTexture = this.#filteredTexture;
			this.#filteredTexture = temp;
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Final draw to canvas
		this.#drawToPlane(filters[filters.length - 1]);
	}

	#drawToPlane({ shader, strength }: Filter): void {
		const gl = this.#engine.gl;
		this.#engine.clear();
		shader.use();
		// Set uniforms
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture);
		const { width, height } = this.#engine.gl.canvas;
		gl.uniform2f(shader.uniform("u_resolution"), width, height);
		gl.uniform1i(shader.uniform("u_texture_color"), 0);
		gl.uniform1i(shader.uniform("u_texture_depth"), 1);
		if (strength) {
			gl.uniform1f(shader.uniform("u_strength"), strength);
		}
		// Set up screen-filling plane
		const positionAttribLoc = shader.attrib("a_position");
		const texCoordAttribLoc = shader.attrib("a_texcoord");
		gl.enableVertexAttribArray(positionAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlanePositions);
		gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlaneTexCoords);
		gl.vertexAttribPointer(texCoordAttribLoc, 2, gl.FLOAT, false, 0, 0);
		// Draw plane
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		this.#engine._drawCalls++;
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
