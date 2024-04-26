import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Quaternion, Vector3 } from "../../common/commontypes";
import type { Model } from "../../common/models";
import { PhysicsWorld, q4, v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";

export class PlaneEntity extends Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: Model[];

	constructor(name: string, pos: Vector3, rotation: Quaternion, model: Model[] = []) {
		super(name, model);
		this.type = "plane";
		this.name = name;
		this.model = model;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: v3(...pos),
			quaternion: q4(...rotation).normalize(),
			fixedRotation: true,
			shape: new phys.Plane(),
		});
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
