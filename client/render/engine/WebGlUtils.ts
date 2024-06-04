export type TextureType = "2d" | "cubemap";

/**
 * This class, the superclass of `GraphicsEngine`, exists mostly as a hack.
 *
 * I wanted to use `this.gl` in `GraphicsEngine`'s class fields outside of the
 * constructor, but since `this.gl` is set from the constructor's parameters, it
 * has to be set in the constructor, after all the class fields evaluate.
 *
 * So to get around that, I'm using this superclass to set `this.gl` first
 * before all of `GraphicsEngine`'s class fields are evaluated. Certified
 * JavaScript moment.
 */
export class WebGlUtils {
	gl: WebGL2RenderingContext;
	// On Nick's computer on Firefox, it's 2048, but fish1 has a 4096x4096 texture
	maxTextureSize: number;
	#textures: Record<number, { type: TextureType; texture: WebGLTexture } | null> = {};

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
		this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
	}

	createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader, varNames: string[] = []): WebGLProgram {
		const gl = this.gl;
		const program = gl.createProgram();
		if (program) {
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			if (varNames.length != 0) {
				gl.transformFeedbackVaryings(program, varNames, gl.SEPARATE_ATTRIBS);
			}
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

	clear(color: readonly [r: number, g: number, b: number] = [0, 0, 0]) {
		const gl = this.gl;
		gl.clearColor(...color, 1);
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
	 * However, this has a significant performance impact because it requires
	 * waiting on the GPU to finish drawing. You will have to trade off
	 * performance with knowing what line of code caused an issue. I recommend
	 * removing `checkError` calls after you're done debugging.
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

	bindTexture(location: number, type: TextureType, texture: WebGLTexture | null): void {
		if (!Number.isInteger(location) || location < 0 || location > 31) {
			throw new RangeError(`${location} is not a valid texture unit. Only up to 32 texture units are supported.`);
		}
		const current = this.#textures[location];
		if ((current?.texture ?? null) === texture) {
			return;
		}
		this.gl.activeTexture(this.gl.TEXTURE0 + location);
		if (current && current.type !== type) {
			// Avoid "Two textures of different types use the same sampler location."
			if (current.type === "2d") {
				this.gl.bindTexture(this.gl.TEXTURE_2D, null);
			} else {
				this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
			}
		}
		if (type === "2d") {
			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		} else {
			this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);
		}
		this.#textures[location] = texture ? { type, texture } : null;
	}

	clearTextures(): void {
		for (const [location, texture] of Object.entries(this.#textures)) {
			if (!texture) {
				continue;
			}
			this.gl.activeTexture(this.gl.TEXTURE0 + +location);
			if (texture.type === "2d") {
				this.gl.bindTexture(this.gl.TEXTURE_2D, null);
			} else {
				this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
			}
		}
		this.#textures = {};
	}
}
