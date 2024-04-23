import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import type { Model } from "../../common/models";
import { PhysicsWorld, TheWorld, v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";

export class CubeEntity implements Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: Model[];

	constructor(name: string, pos: Vector3, model: Model[] = []) {
		this.type = "cube";
		this.name = name;
		this.model = model;

		/*

		const size = 1
		const halfExtents = new CANNON.Vec3(size, size, size)
		const boxShape = new CANNON.Box(halfExtents)
		const boxBody = new CANNON.Body({ mass: 1, shape: boxShape })
		world.addBody(boxBody)
		*/

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Box(v3(1, 1, 2)),
		});
	}

	getPos() {
		return this.body.position;
	}

	getRot() {
		return this.body.quaternion;
	}

	addToWorld(world: PhysicsWorld): void {
		world.addBody(this.body);
	}

	removeFromWorld(world: PhysicsWorld): void {
		world.removeBody(this.body);
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "box",
					size: (this.body.shapes[0] as phys.Box).halfExtents.toArray(),
				},
			],
		};
	}
}
