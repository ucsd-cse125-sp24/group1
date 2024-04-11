import { mat4, vec3 } from "gl-matrix";
import basicVertexSource from "../shaders/basic.vert";
import basicFragmentSource from "../shaders/basic.frag";
import Box from "./Box";
import Camera from "./Camera";

class GraphicsEngine {
	camera: Camera;
	box: Box;

	constructor() {
		this.camera = new Camera(
			vec3.fromValues(5, 5, 5),
			vec3.normalize(vec3.create(), vec3.fromValues(-1, -1, -1)),
			vec3.fromValues(0, 1, 0),
			45,
			window.innerWidth / window.innerHeight,
			0.01,
			100,
		);

		this.box = new Box(
			vec3.fromValues(0, 0, 0),
			vec3.fromValues(2, 2, 2),
			this.createShaderProgram(basicVertexSource, basicFragmentSource),
		);
	}

	createShaderProgram(vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
		const vertexShader = this.#createShader("vertex", vertexShaderSource);
		const fragmentShader = this.#createShader("fragment", fragmentShaderSource);
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

	#createShader(type: "vertex" | "fragment", source: string): WebGLShader {
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

	update(): void {
		this.camera.aspectRatio = window.innerWidth / window.innerHeight;
		this.camera.update(mat4.fromYRotation(mat4.create(), 0.01));
	}

	draw(): void {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		this.box.draw(this.camera.getViewProjectionMatrix());
	}
}

export default GraphicsEngine;
