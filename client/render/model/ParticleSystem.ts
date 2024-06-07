import { mat4, vec3 } from "gl-matrix";
import { expect } from "../../../common/lib/expect";
import particleVertexSource from "../../shaders/particle.vert";
import particleFragmentSource from "../../shaders/particle.frag";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ShaderProgram } from "../engine/ShaderProgram";
import { ParticleOptions } from "../../../common/messages";
import { Model } from "./Model";

/**
 * Creates and draws particles using the particle shader. Several options can be
 * specified in the constructor to determine what the particles look like and
 * how often/many to spawn. The shader itself applies basic physics to each
 * particle so they move naturally.
 *
 * Usage: Construct a `ParticleSystem` with desired options. It is initially
 * disabled, so call `enable()` on it to spawn the first batch of particles and
 * start drawing them. While the `ParticleSystem` is enabled, it will
 * periodically spawn new particle batches as specified by its parameters. Call
 * `disable()` on the `ParticleSystem` to stop spawning and drawing particles.
 * Then call `enable()` and `disable()` again, etc.
 */
export class ParticleSystem implements Model {
	/** Do not set this outside of `ParticleSystem` */
	readonly shader: ShaderProgram;
	enabled: boolean;
	#lastSpawnTime: number;
	#lastFrameTime: number;
	/**
	 * We have two VAOs and two transform feedbacks and swap between them every
	 * frame.
	 */
	#VAOs: [WebGLVertexArrayObject, WebGLVertexArrayObject];
	#transformFeedbacks: [WebGLTransformFeedback, WebGLTransformFeedback];
	#currentVAOIndex: 0 | 1;
	/**
	 * Index to create the next particle at. We treat the attribute buffers as
	 * circular arrays and wrap this index around to 0 once we reach the maximum
	 * number of particles.
	 */
	#nextParticleIndex: number;
	/**
	 * Maximum number of particles from this `ParticleSystem` that can exist at
	 * once. This determines the size of the internal buffers used to store
	 * particle attributes.
	 */
	readonly maxParticles: number;
	/**
	 * Parameters to give to each particle.
	 */
	options: ParticleOptions;

	/**
	 * @param maxParticles Maximum number of particles from this `ParticleSystem`
	 * that can exist at once. This determines the size of the internal buffers
	 * used to store particle attributes. Default: 10
	 * @param options Parameters to give to each particle. These can be changed
	 * after `ParticleSystem` is constructed.
	 */
	constructor(engine: GraphicsEngine, maxParticles = 10, options?: Partial<ParticleOptions>) {
		const gl = engine.gl;

		this.shader = engine.particleShader;
		this.maxParticles = maxParticles;
		this.options = this.#resolveOptions(options);

		this.enabled = false;
		this.#lastSpawnTime = 0;
		this.#lastFrameTime = 0;
		this.#nextParticleIndex = 0;

		this.#VAOs = [
			gl.createVertexArray() ?? expect("Failed to create VAO"),
			gl.createVertexArray() ?? expect("Failed to create VAO"),
		];
		this.#transformFeedbacks = [
			gl.createTransformFeedback() ?? expect("Failed to create transform feedback"),
			gl.createTransformFeedback() ?? expect("Failed to create transform feedback"),
		];
		for (let i = 0; i < this.#VAOs.length; i++) {
			gl.bindVertexArray(this.#VAOs[i]);

			const VBO_position = gl.createBuffer() ?? expect("Failed to create VAO position buffer");
			const positionAttribIndex = this.shader.attrib("a_position");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_position);
			gl.bufferData(gl.ARRAY_BUFFER, this.maxParticles * Float32Array.BYTES_PER_ELEMENT * 3, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(positionAttribIndex, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(positionAttribIndex);

			const VBO_velocity = gl.createBuffer() ?? expect("Failed to create VAO velocity buffer");
			const velocityAttribIndex = this.shader.attrib("a_velocity");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_velocity);
			gl.bufferData(gl.ARRAY_BUFFER, this.maxParticles * Float32Array.BYTES_PER_ELEMENT * 3, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(velocityAttribIndex, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(velocityAttribIndex);

			const VBO_ttl = gl.createBuffer() ?? expect("Failed to create VAO time-to-live buffer");
			const ttlAttribIndex = this.shader.attrib("a_ttl");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_ttl);
			gl.bufferData(gl.ARRAY_BUFFER, this.maxParticles * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(ttlAttribIndex, 1, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(ttlAttribIndex);

			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			// transformFeedbacks[i] writes to buffers in VAOs[i]
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.#transformFeedbacks[i]);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, VBO_position);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, VBO_velocity);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, VBO_ttl);
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

			gl.bindVertexArray(null);
		}
		this.#currentVAOIndex = 0;
	}

	/** Applies defaults to options. */
	#resolveOptions({
		spawnPeriod = Infinity,
		spawnCount = 1,
		size = 256,
		color = [1, 1, 1, 1],
		mass = 1,
		initialPosition = [0, 0, 0],
		initialVelocity = [0, 1, 0],
		initialVelocityRange = undefined,
		ttl = 5,
	}: Partial<ParticleOptions> = {}): ParticleOptions {
		return {
			spawnPeriod,
			spawnCount,
			size,
			color,
			mass,
			initialPosition,
			initialVelocity,
			initialVelocityRange,
			ttl,
		};
	}

	setOptions(options?: Partial<ParticleOptions>): void {
		this.options = this.#resolveOptions(options);
	}

	/**
	 * Zero out all buffers in both VAOs.
	 */
	#clearBuffers(): void {
		const gl = this.shader.engine.gl;
		const zeros = new Float32Array(this.maxParticles * 3);
		for (let i = 0; i < this.#VAOs.length; i++) {
			gl.bindVertexArray(this.#VAOs[i]);

			const positionBuffer: WebGLBuffer = gl.getVertexAttrib(
				this.shader.attrib("a_position"),
				gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, zeros);

			const velocityBuffer: WebGLBuffer = gl.getVertexAttrib(
				this.shader.attrib("a_velocity"),
				gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, zeros);

			const ttlBuffer: WebGLBuffer = gl.getVertexAttrib(
				this.shader.attrib("a_ttl"),
				gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, ttlBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, zeros.subarray(0, this.maxParticles));

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindVertexArray(null);
		}

		this.#nextParticleIndex = 0;
	}

	/**
	 * Enable particle drawing, spawn a new batch of particles, and reset the
	 * spawn timer.
	 */
	enable(): void {
		this.enabled = true;
		this.#clearBuffers();
		this.#spawnBatch();
		this.#lastFrameTime = Date.now();
	}

	/**
	 * Disable particle drawing and spawning.
	 */
	disable(): void {
		this.enabled = false;
	}

	/**
	 * Write new particle data into the attribute buffers of the current VAO. We
	 * only need to write the current VAO because the transform feedback will
	 * update the other VAO with new data after the next draw.
	 */
	#spawnBatch(): void {
		const gl = this.shader.engine.gl;
		const numToSpawn = Math.min(this.options.spawnCount, this.maxParticles);
		const availableBufferLength = this.maxParticles - this.#nextParticleIndex;
		console.log(numToSpawn);

		const newPositions = Float32Array.from(
			Array.from({ length: numToSpawn }, () => this.options.initialPosition).flat(),
		);
		const newVelocities = Float32Array.from(
			Array.from({ length: numToSpawn }, () => {
				const v = this.options.initialVelocity;
				const range = this.options.initialVelocityRange;
				if (range === undefined) {
					return v;
				}
				const randVector = vec3.random(vec3.create());
				const r0 = (randVector[0] * range[0]) / 2;
				const r1 = (randVector[1] * range[1]) / 2;
				const r2 = (randVector[2] * range[2]) / 2;
				return [v[0] + r0, v[1] + r1, v[2] + r2];
			}).flat(),
		);
		const newTtls = Float32Array.from(Array.from({ length: numToSpawn }, () => this.options.ttl));

		gl.bindVertexArray(this.#VAOs[this.#currentVAOIndex]);

		const positionBuffer: WebGLBuffer = gl.getVertexAttrib(
			this.shader.attrib("a_position"),
			gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferSubData(
			gl.ARRAY_BUFFER,
			this.#nextParticleIndex * Float32Array.BYTES_PER_ELEMENT * 3,
			newPositions.subarray(0, availableBufferLength * 3),
		);
		if (availableBufferLength < numToSpawn) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, newPositions.subarray((numToSpawn - availableBufferLength) * 3));
		}

		const velocityBuffer: WebGLBuffer = gl.getVertexAttrib(
			this.shader.attrib("a_velocity"),
			gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
		gl.bufferSubData(
			gl.ARRAY_BUFFER,
			this.#nextParticleIndex * Float32Array.BYTES_PER_ELEMENT * 3,
			newVelocities.subarray(0, availableBufferLength * 3),
		);
		if (availableBufferLength < numToSpawn) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, newVelocities.subarray((numToSpawn - availableBufferLength) * 3));
		}

		const ttlBuffer: WebGLBuffer = gl.getVertexAttrib(
			this.shader.attrib("a_ttl"),
			gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, ttlBuffer);
		gl.bufferSubData(
			gl.ARRAY_BUFFER,
			this.#nextParticleIndex * Float32Array.BYTES_PER_ELEMENT,
			newTtls.subarray(0, availableBufferLength),
		);
		if (availableBufferLength < numToSpawn) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, newTtls.subarray(numToSpawn - availableBufferLength));
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindVertexArray(null);

		this.#nextParticleIndex = (this.#nextParticleIndex + numToSpawn) % this.maxParticles;
		this.#lastSpawnTime = Date.now();
	}

	draw(models: mat4[], view: mat4): void {
		if (!this.enabled) {
			return;
		}
		if (Date.now() - this.#lastSpawnTime >= this.options.spawnPeriod) {
			this.#spawnBatch();
		}

		const gl = this.shader.engine.gl;
		const dt = Date.now() - this.#lastFrameTime;
		this.#lastFrameTime += dt;

		gl.bindVertexArray(this.#VAOs[this.#currentVAOIndex]);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.#transformFeedbacks[1 - this.#currentVAOIndex]);

		gl.uniform1f(this.shader.uniform("u_size"), this.options.size);
		gl.uniform4fv(this.shader.uniform("u_color"), this.options.color);
		gl.uniform1f(this.shader.uniform("u_ttl_max"), this.options.ttl);
		gl.uniform1f(this.shader.uniform("u_mass"), this.options.mass);
		gl.uniform1f(this.shader.uniform("u_dt"), dt / 1000);

		for (const model of models) {
			gl.uniformMatrix4fv(this.shader.uniform("u_model"), false, model);
			gl.beginTransformFeedback(gl.POINTS);
			gl.drawArrays(gl.POINTS, 0, this.maxParticles);
			this.shader.engine._drawCalls++;
			gl.endTransformFeedback();
		}

		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
		gl.bindVertexArray(null);

		// Swap buffers
		this.#currentVAOIndex = (1 - this.#currentVAOIndex) as 0 | 1;
	}

	print() {
		const gl = this.shader.engine.gl;
		console.log(`current index: ${this.#currentVAOIndex}`);
		const debugArray = new Float32Array(this.maxParticles * 3);
		for (let i = 0; i < 2; i++) {
			gl.bindVertexArray(this.#VAOs[i]);
			const positionBuffer: WebGLBuffer = gl.getVertexAttrib(
				this.shader.attrib("a_position"),
				gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.getBufferSubData(gl.ARRAY_BUFFER, 0, debugArray);
			console.log(`position buffer ${i}: ${debugArray}`);
			const velocityBuffer: WebGLBuffer = gl.getVertexAttrib(
				this.shader.attrib("a_velocity"),
				gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
			gl.getBufferSubData(gl.ARRAY_BUFFER, 0, debugArray);
			console.log(`velocity buffer ${i}: ${debugArray}`);
			const ttlBuffer: WebGLBuffer = gl.getVertexAttrib(
				this.shader.attrib("a_ttl"),
				gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING,
			);
			gl.bindBuffer(gl.ARRAY_BUFFER, ttlBuffer);
			gl.getBufferSubData(gl.ARRAY_BUFFER, 0, debugArray, 0, this.maxParticles);
			console.log(`ttl buffer ${i}: ${debugArray.subarray(0, this.maxParticles)}`);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindVertexArray(null);
		}
	}

	areParticlesDead(): boolean {
		return Date.now() - this.#lastSpawnTime > this.options.ttl * 1000;
	}
}
