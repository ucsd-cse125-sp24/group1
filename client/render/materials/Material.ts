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

	uniform(name: string): WebGLUniformLocation {
		this.#uniformLocations[name] ??= this.engine.gl.getUniformLocation(this.#program, name);
		const location = this.#uniformLocations[name];
		if (location === null) {
			throw new ReferenceError(`Uniform ${name} not found`);
		}
		return location;
	}

	attrib(name: string): number {
		this.#attribLocations[name] ??= this.engine.gl.getAttribLocation(this.#program, name);
		if (this.#attribLocations[name] === -1) {
			throw new ReferenceError(`Attribute ${name} not found`);
		}
		return this.#attribLocations[name];
	}
}
