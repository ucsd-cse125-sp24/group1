import basicFragmentSource from "../../shaders/basic.frag";
import basicVertexSource from "../../shaders/basic.vert";
import gltfFragmentSource from "../../shaders/gltf.frag";
import gltfVertexSource from "../../shaders/gltf.vert";
import wireframeFragmentSource from "../../shaders/wireframe.frag";
import wireframeVertexSource from "../../shaders/wireframe.vert";
import toonShaderSouce from "../../shaders/toon.frag";
import toonShaderSouce2 from "../../shaders/toon2.frag";
import { WebGlUtils } from "./WebGlUtils";
import { BoxGeometry } from "../geometries/BoxGeometry";
import { HardCodedGeometry } from "../geometries/HardCodedGeometry";
import { ShaderProgram } from "./ShaderProgram";
import particleFragmentSource from "../../shaders/particle.frag";
import particleVertexSource from "../../shaders/particle.vert";
import filterVertexSource from "../../shaders/filter.vert";
import noOpFilterFragmentSource from "../../shaders/filterNoOp.frag";

/**
 * Handles helper functions for interacting with WebGL.
 */
class GraphicsEngine extends WebGlUtils {
	tempMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", basicVertexSource, "basic.vert"),
			this.createShader("fragment", toonShaderSouce2, "toon2.frag"),
		),
	);
	tempGeometry = new BoxGeometry(this.tempMaterial, [1, 1, 1]);
	wireframeMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", wireframeVertexSource, "wireframe.vert"),
			this.createShader("fragment", wireframeFragmentSource, "wireframe.frag"),
		),
	);
	wireframeGeometry = new HardCodedGeometry(this.wireframeMaterial);
	gltfMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", gltfVertexSource, "gltf.vert"),
			this.createShader("fragment", gltfFragmentSource, "gltf.frag"),
		),
	);
	particleMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", particleVertexSource, "particle.vert"),
			this.createShader("fragment", particleFragmentSource, "particle.frag"),
			["v_position", "v_velocity", "v_age", "v_life"],
		),
	);

	#framebuffer: WebGLFramebuffer | null;
	#colorTexture: WebGLTexture | null;
	#depthTexture: WebGLTexture | null;
	#textureWidth: number;
	#textureHeight: number;
	#imagePlanePositions: WebGLBuffer | null;
	#imagePlaneTexCoords: WebGLBuffer | null;
	#filter = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", filterVertexSource, "filter.vert"),
			this.createShader("fragment", noOpFilterFragmentSource, "filterNoOp.frag"),
		),
	);

	constructor(gl: WebGL2RenderingContext) {
		super(gl);

		this.#imagePlanePositions = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlanePositions);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
		this.#imagePlaneTexCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlaneTexCoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

		this.#textureWidth = 0;
		this.#textureHeight = 0;
		// Textures will be allocated before first frame
		this.#colorTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
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
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.#colorTexture, 0);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.#depthTexture, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	startRender() {
		const gl = this.gl;

		// Reallocate textures if canvas size has changed
		if (gl.canvas.width !== this.#textureWidth || gl.canvas.height !== this.#textureHeight) {
			this.resizeTextures(gl.canvas.width, gl.canvas.height);
			this.#textureWidth = gl.canvas.width;
			this.#textureHeight = gl.canvas.height;
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.#framebuffer);
	}

	stopRender() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	resizeTextures(width: number, height: number) {
		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	draw() {
		const gl = this.gl;
		this.clear();
		this.#filter.use();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.#colorTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.#depthTexture);
		gl.uniform1i(this.#filter.uniform("u_texture_color"), 0);
		gl.uniform1i(this.#filter.uniform("u_texture_depth"), 1);
		const positionAttribLoc = this.#filter.attrib("a_position");
		const texCoordAttribLoc = this.#filter.attrib("a_texcoord");
		gl.enableVertexAttribArray(positionAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlanePositions);
		gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.#imagePlaneTexCoords);
		gl.vertexAttribPointer(texCoordAttribLoc, 2, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.disableVertexAttribArray(positionAttribLoc);
		gl.disableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}

export default GraphicsEngine;
