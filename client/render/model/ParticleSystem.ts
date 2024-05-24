import { vec3 } from "gl-matrix";
import { expect } from "../../../common/lib/expect";
import particleVertexSource from "../../shaders/particle.vert";
import particleFragmentSource from "../../shaders/particle.frag";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ShaderProgram } from "../engine/ShaderProgram";
import { Model } from "./Model";

export type ParticleOptions = {
	size: number;
	color: vec3;
	/** Can be positive, 0, or negative */
	mass: number;
	initialPosition: vec3;
	initialVelocity: vec3;
	initialVelocityRange?: vec3;
	/** Remaining time to live in seconds */
	ttl: number;
};

export class ParticleSystem implements Model {
	/** Do not set this outside of `ParticleSystem` */
	shader: ShaderProgram;
	#enabled: boolean;
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
	#maxParticles: number;
	/**
	 * Length of time between particle spawns in milliseconds. Set to +inf to only
	 * spawn particles one time when the `ParticleSystem` is (re-)enabled.
	 */
	spawnPeriod: number;
	/**
	 * Number of particles to create in each spawn batch.
	 */
	spawnCount: number;
	/**
	 * Parameters to give to each particle.
	 */
	options: ParticleOptions;

	constructor(
		engine: GraphicsEngine,
		maxParticles = 10,
		spawnPeriod = 1000,
		spawnCount = 5,
		{
			size = 16,
			color = [1, 1, 1],
			mass = 1,
			initialPosition = [0, 0, 0],
			initialVelocity = [0, 1, 0],
			initialVelocityRange = undefined,
			ttl = 5,
		}: Partial<ParticleOptions> = {},
	) {
		const gl = engine.gl;

		this.shader = new ShaderProgram(
			engine,
			engine.createProgram(
				engine.createShader("vertex", particleVertexSource, "particle.vert"),
				engine.createShader("fragment", particleFragmentSource, "particle.frag"),
				["v_position", "v_velocity", "v_ttl"],
			),
		);
		this.#maxParticles = maxParticles;
		this.spawnPeriod = spawnPeriod;
		this.spawnCount = spawnCount;
		this.options = { size, color, mass, initialPosition, initialVelocity, initialVelocityRange, ttl };

		this.#enabled = false;
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
			gl.bufferData(gl.ARRAY_BUFFER, this.#maxParticles * Float32Array.BYTES_PER_ELEMENT * 3, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(positionAttribIndex, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(positionAttribIndex);

			const VBO_velocity = gl.createBuffer() ?? expect("Failed to create VAO velocity buffer");
			const velocityAttribIndex = this.shader.attrib("a_velocity");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_velocity);
			gl.bufferData(gl.ARRAY_BUFFER, this.#maxParticles * Float32Array.BYTES_PER_ELEMENT * 3, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(velocityAttribIndex, 3, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(velocityAttribIndex);

			const VBO_ttl = gl.createBuffer() ?? expect("Failed to create VAO time-to-live buffer");
			const ttlAttribIndex = this.shader.attrib("a_ttl");
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO_ttl);
			gl.bufferData(gl.ARRAY_BUFFER, this.#maxParticles * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
			gl.vertexAttribPointer(ttlAttribIndex, 1, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(ttlAttribIndex);

			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.#transformFeedbacks[i]);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, VBO_position);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, VBO_velocity);
			gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, VBO_ttl);
			gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

			gl.bindVertexArray(null);
		}
		this.#currentVAOIndex = 0;
	}

	#clearBuffers(): void {
		const gl = this.shader.engine.gl;
		const zeros = Float32Array.from(new Array(this.#maxParticles * 3).fill(0));
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
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, zeros.subarray(0, this.#maxParticles));

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindVertexArray(null);
		}

		this.#nextParticleIndex = 0;
	}

	enable(): void {
		this.#enabled = true;
		this.#clearBuffers();
		this.#spawnBatch();
		this.#lastFrameTime = Date.now();
	}

	disable(): void {
		this.#enabled = false;
	}

	#spawnBatch(): void {
		const gl = this.shader.engine.gl;
		const numToSpawn = Math.min(this.spawnCount, this.#maxParticles);
		const availableBufferLength = this.#maxParticles - this.#nextParticleIndex;

		const newPositions = Float32Array.from(new Array(numToSpawn).fill(this.options.initialPosition).flat());
		const newVelocities = Float32Array.from(
			new Array(numToSpawn)
				.fill(this.options.initialVelocity)
				.map((v: [number, number, number]) => {
					const range = this.options.initialVelocityRange;
					if (range === undefined) {
						return v;
					}
					const r0 = Math.random() * range[0] - range[0] / 2;
					const r1 = Math.random() * range[1] - range[1] / 2;
					const r2 = Math.random() * range[2] - range[2] / 2;
					return [v[0] + r0, v[1] + r1, v[2] + r2];
				})
				.flat(),
		);
		const newTtls = Float32Array.from(new Array(numToSpawn).fill(this.options.ttl));

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

		this.#nextParticleIndex = (this.#nextParticleIndex + numToSpawn) % this.#maxParticles;
		this.#lastSpawnTime = Date.now();
	}

	draw(): void {
		if (!this.#enabled) {
			return;
		}
		if (Date.now() - this.#lastSpawnTime >= this.spawnPeriod) {
			this.#spawnBatch();
		}

		const gl = this.shader.engine.gl;
		const dt = Date.now() - this.#lastFrameTime;
		this.#lastFrameTime += dt;

		gl.bindVertexArray(this.#VAOs[this.#currentVAOIndex]);
		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.#transformFeedbacks[1 - this.#currentVAOIndex]);

		gl.uniform1f(this.shader.uniform("u_size"), this.options.size);
		gl.uniform3fv(this.shader.uniform("u_color"), this.options.color);
		gl.uniform1f(this.shader.uniform("u_mass"), this.options.mass);
		gl.uniform1f(this.shader.uniform("u_dt"), dt / 1000);

		gl.beginTransformFeedback(gl.POINTS);
		gl.drawArrays(gl.POINTS, 0, this.#maxParticles);
		gl.endTransformFeedback();

		gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
		gl.bindVertexArray(null);

		// Swap buffers
		this.#currentVAOIndex = (1 - this.#currentVAOIndex) as 0 | 1;
	}

	#print() {
		const gl = this.shader.engine.gl;
		console.log(`current index: ${this.#currentVAOIndex}`);
		const debugArray = new Float32Array(this.#maxParticles * 3);
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
			gl.getBufferSubData(gl.ARRAY_BUFFER, 0, debugArray, 0, this.#maxParticles);
			console.log(`ttl buffer ${i}: ${debugArray.subarray(0, this.#maxParticles)}`);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindVertexArray(null);
		}
	}
}
