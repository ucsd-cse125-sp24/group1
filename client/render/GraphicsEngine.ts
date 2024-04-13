import { BoxGeometry } from "./geometries/BoxGeometry";
import { Geometry } from "./geometries/Geometry";
import { HardCodedGeometry } from "./geometries/HardCodedGeometry";
import { Material } from "./materials/Material";
import basicFragmentSource from "../shaders/basic.frag";
import basicVertexSource from "../shaders/basic.vert";
import boxFragmentSource from "../shaders/box.vert";
import wireframeVertexSource from "../shaders/wireframe.frag";

class GraphicsEngine {
	gl: WebGL2RenderingContext;
	tempMaterial: Material;
	tempGeometry: Geometry;
	wireframeBox: Geometry;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;

		this.tempMaterial = new Material(
			this,
			this.createShader("vertex", basicVertexSource, "basic.vert"),
			this.createShader("fragment", basicFragmentSource, "basic.frag"),
		);
		this.tempGeometry = new BoxGeometry(this.tempMaterial, [1, 1, 1]);

		const wireframeShader = this.createShader("fragment", wireframeVertexSource, "wireframe.frag");
		this.wireframeBox = new HardCodedGeometry(
			new Material(this, this.createShader("vertex", boxFragmentSource, "box.vert"), wireframeShader),
			36,
		);
	}

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

	createShader(type: "vertex" | "fragment", source: string, name = "Untitled shader"): WebGLShader {
		const gl = this.gl;
		const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		if (shader) {
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				return shader;
			}
			console.error(`${name} failed to compile:`, gl.getShaderInfoLog(shader));
		}
		gl.deleteShader(shader);
		throw new Error("Failed to create shader");
	}

	clear() {
		const gl = this.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

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
