import { mat4, vec3 } from "gl-matrix";

class GraphicsEngine {
	gl: WebGL2RenderingContext;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
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

	createShader(type: "vertex" | "fragment", source: string): WebGLShader {
		const gl = this.gl;
		const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		if (shader) {
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				return shader;
			}
			console.error(gl.getShaderInfoLog(shader));
		}
		gl.deleteShader(shader);
		throw new Error("Failed to create shader");
	}

	clear() {
		const gl = this.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
}

export default GraphicsEngine;
