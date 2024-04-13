import * as phys from "cannon-es";
import { SERVER_GAME_TICK } from "../common/constants";
import { SerializedCollision, SerializedEntity } from "../common/messages";

type WorldSetup = {
	gravity: [number, number, number],

}

function v3(a:number, b:number, c:number) {
	return new phys.Vec3(a, b, c);
}
function q4(x:number, y:number, z:number, w: number) {
	return new phys.Quaternion(x, y, z, w);
}

export class TheWorld {

	#world: phys.World;
	#colliders: {[key:string]: phys.Body};

	constructor(setup: WorldSetup) {
		this.#world = new phys.World({
			gravity: v3(...setup.gravity),
		});
		this.#colliders = {};
		this.initWorld();
	}

	initWorld() {
		// create a funny box
		this.#colliders.box = new phys.Body({
			position: v3(0,6,20),
			velocity: v3(0,0,0),
			quaternion: q4(1,2,3,4).normalize(),
			shape: new phys.Box(v3(1,1,1)),
			mass: 200,
			material: new phys.Material({
				friction: 3,
				restitution: 20
			})
		});

		// Create a plane pointing up at positive y, 
		this.#colliders.plane = new phys.Body({
			shape: new phys.Plane(),
			position: v3(0, -20, 0),
			quaternion: q4(-1,0,0,1).normalize(),
			type: phys.Body.STATIC
		});

		this.#world.addBody(this.#colliders.plane);

		this.#world.addBody(this.#colliders.box);
	}

	nextTick() {
		console.log("box is at:", this.#colliders.box.position, "velocity:",this.#colliders.box.velocity);
		this.#world.step(1 / SERVER_GAME_TICK);
	}


	/**
	 * Serialize this TheWorld into a format that represents the state of this class
	 */
	serialize() {
		let serial = [];

		for (let body of Object.values(this.#colliders)) {

			let entity: SerializedEntity = {
				geometryId: body.id,
				materialId: 0,
				position: body.position.toArray(),
				quaternion: body.quaternion.toArray(),
				collisions: []
			};
			
			for (let shape of body.shapes) {
				let collider: SerializedCollision | undefined = undefined;
				if (shape instanceof phys.Box) {
					collider = {
						type: "box",
						size: shape.halfExtents.toArray(),
					};
				} else if (shape instanceof phys.Plane) {
					collider = {
						type: "plane"
					}
				}
				if (collider) {
					entity.collisions.push(collider);
				} else {
					console.error("Unknown Collider", collider);
				}
			}
			serial.push(entity);
		}
		return serial;
	}

	/**
	 * Deserialize a serialized TheWorld and set the properties of this class
	 */
	deserialize() {

	}
}