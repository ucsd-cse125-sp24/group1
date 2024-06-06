import { mat4 } from "gl-matrix";
import { ParticleOptions } from "../../../common/messages";
import GraphicsEngine from "../engine/GraphicsEngine";
import { ParticleSystem } from "./ParticleSystem";

/**
 * Plays sounds. Permits playing multiple instances of the same sound, and
 * recycles `Audio` objects.
 *
 * Code taken from https://nolanchai.dev/Commit-Challenge-2024/spamsound.html
 */
export class ParticleManager {
	#engine: GraphicsEngine;
	#particles: ParticleSystem[] = [];

	constructor(engine: GraphicsEngine) {
		this.#engine = engine;
	}

	create(options: Partial<ParticleOptions>): void {
		const particleCount = options.spawnCount ?? 1;
		let particleSystem;
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
