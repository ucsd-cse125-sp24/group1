import * as phys from "cannon-es";
import { Box, Body, Plane, World } from "cannon-es";
import { SERVER_GAME_TICK } from "../common/constants";
import { SerializedBody, SerializedCollider, SerializedEntity } from "../common/messages";
import { PlayerGroundCM, PlayerPlayerCM, PlayerSlipperyCM, SlipperyGroundCM, ItemPlayerCM, ItemGroundCM } from "./materials/ContactMaterials";
import { Entity } from "./entities/Entity";
import { serializeShape } from "./lib/serializeShape";

type WorldSetup = {
	gravity: [number, number, number];
};

//I HATE THIS FUNCTION FUCK YOU NICK
export function v3(a: number, b: number, c: number) {
	return new phys.Vec3(a, b, c);
}
export function q4(x: number, y: number, z: number, w: number) {
	return new phys.Quaternion(x, y, z, w);
}

export class PhysicsWorld {
	#world: phys.World;
	#colliders: phys.Body[];

	constructor(setup: WorldSetup) {
		this.#world = new World({
			gravity: v3(...setup.gravity),
		});
		this.#colliders = [];

		this.#world.addContactMaterial(PlayerGroundCM);
		this.#world.addContactMaterial(PlayerPlayerCM);
		this.#world.addContactMaterial(SlipperyGroundCM);
		this.#world.addContactMaterial(PlayerSlipperyCM);
		this.#world.addContactMaterial(ItemPlayerCM);
		this.#world.addContactMaterial(ItemGroundCM);

	}

	addBody(body: Body) {
		this.#world.addBody(body);
		this.#colliders.push(body);
	}
	removeBody(body: Body) {
		this.#world.removeBody(body);
		this.#colliders.splice(this.#colliders.indexOf(body), 1);
	}

	#time = 0;
	nextTick() {
		// console.log("box is at:", this.#colliders.box.position, "velocity:", this.#colliders.box.velocity);
		this.#world.step(1 / SERVER_GAME_TICK);
		this.#time += SERVER_GAME_TICK;
		/*if (this.#time > 6000) {
			this.#colliders.box.position = v3(0, 6, 5);
			this.#colliders.box.quaternion = q4(
				Math.random() + 0.1,
				Math.random() + 0.1,
				Math.random() + 0.1,
				Math.random() + 0.1,
			).normalize();
			this.#time = 0;
		}*/
	}

	castRay(ray: phys.Ray, rayOptions: phys.RayOptions): phys.RaycastResult {
		ray.intersectWorld(this.#world, rayOptions);
		return ray.result;
	}

	/**
	 * Returns a list of bodies that are not present in the given map.
	 */
	getPhantomBodies(bodyToEntityMap: Map<Body, Entity>): Body[] {
		return this.#world.bodies.filter((body) => !bodyToEntityMap.has(body));
	}

	/**
	 * Serialize every body and collider in the physics engine to draw as
	 * wireframes for debug purposes.
	 *
	 * IMPORTANT: Do not use any instance variables like `this.#colliders`, which
	 * are copies of physics state and may get out of sync. This function MUST
	 * call directly to the physics engine, or this can hide desync issues that
	 * will make debugging a nightmare.
	 */
	serialize(): SerializedBody[] {
		return this.#world.bodies.map((body) => ({
			position: body.position.toArray(),
			quaternion: body.quaternion.toArray(),
			colliders: body.shapes.map((shape, i) => ({
				...serializeShape(shape),
				offset: body.shapeOffsets[i].toArray(),
				orientation: body.shapeOrientations[i].toArray(),
			})),
		}));
	}
}

export const TheWorld = new PhysicsWorld({ gravity: [0, -15.82, 0] });
