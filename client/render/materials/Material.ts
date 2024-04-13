import GraphicsEngine from "../GraphicsEngine";

/**
 * A material represents a shader program.
 */
export class Material {
	engine: GraphicsEngine;
	#program: WebGLProgram;
	#uniformLocations: Record<string, WebGLUniformLocation | null> = {};
	#attribLocations: Record<string, number> = {};

	constructor(engine: GraphicsEngine, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
		this.engine = engine;
		this.#program = engine.createProgram(vertexShader, fragmentShader);
	}

	use() {
		this.engine.gl.useProgram(this.#program);
	}

	uniform(name: string): WebGLUniformLocation | null {
		this.#uniformLocations[name] ??= this.engine.gl.getUniformLocation(this.#program, name);
		return this.#uniformLocations[name];
	}

	attrib(name: string): number {
		this.#attribLocations[name] ??= this.engine.gl.getAttribLocation(this.#program, name);
		return this.#attribLocations[name];
	}
}
