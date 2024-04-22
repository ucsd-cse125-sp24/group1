import * as phys from "cannon-es";
import { Box, Material, Body, Plane, World } from "cannon-es";
import { SERVER_GAME_TICK } from "../common/constants";
import { SerializedCollider, SerializedEntity } from "../common/messages";

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
		this.initWorld();
	}

	initWorld() {
		// // create a funny box
		// this.#colliders.push(new Body({
		// 	position: v3(0, 6, 5),
		// 	velocity: v3(0, 0, 0),
		// 	quaternion: q4(1, 2, 3, 4).normalize(),
		// 	shape: new Box(v3(1, 0.5, 1)),
		// 	mass: 200,
		// 	material: new Material({
		// 		friction: 3,
		// 		restitution: 20,
		// 	}),
		// }));

		// Create a plane pointing up at positive y,
		this.#colliders.push(
			new Body({
				shape: new Plane(),
				position: v3(0, -5, 0),
				quaternion: q4(-1, 0, 0, 1).normalize(),
				type: phys.Body.STATIC,
			}),
		);

		for (let collider of this.#colliders) {
			this.#world.addBody(collider);
		}
	}

	addBody(body: Body) {
		this.#world.addBody(body);
		this.#colliders.push(body);
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

	/**
	 * Serialize this TheWorld into a format that represents the state of this class
	 */
	serialize(): SerializedEntity[] {
		let serial = [];

		for (let body of Object.values(this.#colliders)) {
			let entity: SerializedEntity = {
				name: body.id.toString(),
				model: ["debuggable"],
				position: body.position.toArray(),
				quaternion: body.quaternion.toArray(),
				colliders: [],
			};

			for (let shape of body.shapes) {
				let collider: SerializedCollider | undefined = undefined;
				if (shape instanceof Box) {
					collider = {
						type: "box",
						size: shape.halfExtents.toArray(),
					};
				} else if (shape instanceof Plane) {
					collider = {
						type: "plane",
					};
				} else if (shape instanceof phys.Sphere) {
					collider = {
						type: "sphere",
						radius: shape.radius,
					};
				} else if (shape instanceof phys.Cylinder) {
					collider = {
						type: "cylinder",
						radiusTop: shape.radiusTop,
						radiusBottom: shape.radiusBottom,
						height: shape.height,
						numSegments: shape.numSegments,
					};
				}
				if (collider) {
					entity.colliders.push(collider);
				} else {
					console.error("Unknown Collider", shape.type);
				}
			}
			serial.push(entity);
		}
		return serial;
	}
}

export const TheWorld = new PhysicsWorld({ gravity: [0, -9.82, 0] });
