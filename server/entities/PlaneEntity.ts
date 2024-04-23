import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import type { Model } from "../../common/models";
import { PhysicsWorld, TheWorld, v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";

export class PlaneEntity implements Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: Model[];

	constructor(name: string, pos: Vector3, model: Model[] = []) {
		this.type = "plane";
		this.name = name;
		this.model = model;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: v3(...pos),
			fixedRotation: true,
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
					type: "plane",
				},
			],
		};
	}
}
