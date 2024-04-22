import basicFragmentSource from "../shaders/basic.frag";
import basicVertexSource from "../shaders/basic.vert";
import gltfFragmentSource from "../shaders/gltf.frag";
import gltfVertexSource from "../shaders/gltf.vert";
import wireframeFragmentSource from "../shaders/wireframe.frag";
import wireframeVertexSource from "../shaders/wireframe.vert";
import toonShaderSouce from "../shaders/toon.frag";
import toonShaderSouce2 from "../shaders/toon2.frag";
import { WebGlUtils } from "./WebGlUtils";
import { BoxGeometry } from "./geometries/BoxGeometry";
import { HardCodedGeometry } from "./geometries/HardCodedGeometry";
import { Material } from "./materials/Material";

/**
 * Handles helper functions for interacting with WebGL.
 */
class GraphicsEngine extends WebGlUtils {
	tempMaterial = new Material(
		this,
		this.createShader("vertex", basicVertexSource, "basic.vert"),
		this.createShader("fragment", toonShaderSouce2, "toon2.frag"),
	);
	tempGeometry = new BoxGeometry(this.tempMaterial, [1, 1, 1]);
	wireframeMaterial = new Material(
		this,
		this.createShader("vertex", wireframeVertexSource, "wireframe.vert"),
		this.createShader("fragment", wireframeFragmentSource, "wireframe.frag"),
	);
	wireframeGeometry = new HardCodedGeometry(this.wireframeMaterial);
	gltfMaterial = new Material(
		this,
		this.createShader("vertex", gltfVertexSource, "gltf.vert"),
		this.createShader("fragment", gltfFragmentSource, "gltf.frag"),
	);

	createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
		const gl = this.gl;
		const program = gl.createProgram();
		if (program) {
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			gl.linkProgram(program);
			if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
				return program;
			}
			console.error(gl.getProgramInfoLog(program));
		}
		gl.deleteProgram(program);
		throw new Error("Failed to create program");
	}

	/**
	 * A helper method for compiling a shader. Useful for creating `Material`s.
	 *
	 * @param type The type of shader to compile for.
	 * @param source The GLSL code of the shader.
	 * @param name The name of the shader file. This is only used when the shader
	 * fails to compile, so it's helpful for debugging purposes to set this to
	 * @returns The compiled shader.
	 */
	createShader(type: "vertex" | "fragment", source: string, name = "Untitled shader"): WebGLShader {
		const gl = this.gl;
		const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		if (!shader) {
			throw new Error("Failed to create shader");
		}
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		}
		const infoLog = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new SyntaxError(`${name} failed to compile:\n${infoLog}`);
	}

	clear() {
		const gl = this.gl;
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

	/**
	 * By default, WebGL won't throw an error if you do something wrong. Instead,
	 * you have to manually ask WebGL if there have been any errors.
	 *
	 * If you think something is wrong, you can call this method after every WebGL
	 * call, and this will throw an error if something has gone wrong.
	 *
	 * Even then, the errors that WebGL gives aren't very specific or helpful.
	 * You'll get better quality error messages in the console when it happens.
	 * `checkError` is only good for halting the entire game when an error arises,
	 * which is helpful for debugging.
	 *
	 * To keep code clean, it's a good idea to remove `checkError` calls when
	 * you're done debugging and everything works.
	 */
	checkError() {
		const error = this.gl.getError();
		// Error messages from MDN:
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
		switch (error) {
			case this.gl.NO_ERROR:
				return;
			case this.gl.INVALID_ENUM:
				throw new TypeError("INVALID_ENUM: An unacceptable value has been specified for an enumerated argument.");
			case this.gl.INVALID_VALUE:
				throw new RangeError("INVALID_VALUE: A numeric argument is out of range.");
			case this.gl.INVALID_OPERATION:
				throw new TypeError("INVALID_OPERATION: The specified command is not allowed for the current state.");
			case this.gl.INVALID_FRAMEBUFFER_OPERATION:
				throw new Error(
					"INVALID_FRAMEBUFFER_OPERATION: The currently bound framebuffer is not framebuffer complete when trying to render to or to read from it.",
				);
			case this.gl.OUT_OF_MEMORY:
				throw new RangeError("OUT_OF_MEMORY: Not enough memory is left to execute the command.");
			case this.gl.CONTEXT_LOST_WEBGL:
				throw new Error("CONTEXT_LOST_WEBGL: The WebGL context is lost.");
		}
	}
}

export default GraphicsEngine;
