import { mat4 } from "gl-matrix";
import { ParticleOptions } from "../../../common/messages";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ParticleSystem } from "./ParticleSystem";

/**
 * Recycles `ParticleSystem` objects to play multiple particles at once without
 * consuming unnecessary memory.
 */
export class ParticleManager {
	#engine: GraphicsEngine;
	#particles: ParticleSystem[] = [];

	constructor(engine: GraphicsEngine) {
		this.#engine = engine;
	}

	/**
	 * Enables a `ParticleSystem` object. It first tries to use a disabled
	 * `ParticleSystem` object that has sufficient capacity
	 */
	create(options: Partial<ParticleOptions>): void {
		const particleCount = options.spawnCount ?? 1;
		// Finds an available ParticleSystem with the smallest capacity
		let particleSystem = this.#particles.reduce<ParticleSystem | null>(
			(cum, curr) =>
				!curr.enabled && curr.maxParticles >= particleCount && (!cum || curr.maxParticles < cum.maxParticles)
					? curr
					: cum,
			null,
		);
		for (const particles of this.#particles) {
			if (particles.enabled || particles.maxParticles < particleCount) {
				continue;
			}
			particleSystem = particles;
		}
		if (!particleSystem) {
			particleSystem = new ParticleSystem(this.#engine, particleCount, options);
			this.#particles.push(particleSystem);
		} else {
			particleSystem.setOptions(options);
		}
		particleSystem.enable();
	}

	/**
	 * Draws all the enabled particles, as well as disabling (marking as reusable)
	 * particles that should've expired (per `ttl`).
	 */
	paint(view: mat4) {
		this.#engine.particleShader.use();
		this.#engine.gl.uniformMatrix4fv(this.#engine.particleShader.uniform("u_view"), false, view);
		for (const particles of this.#particles) {
			if (!particles.enabled || particles.areParticlesDead()) {
				particles.disable();
				continue;
			}
			particles.draw([mat4.create()], view);
		}
	}
}
