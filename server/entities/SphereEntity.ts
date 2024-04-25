import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import type { Model } from "../../common/models";
import { v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";

export class SphereEntity extends Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: Model[];

	constructor(name: string, pos: Vector3, radius: number, model: Model[] = []) {
		super(name, model);
		this.type = "sphere";
		this.name = name;
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Sphere(radius),
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
					type: "sphere",
					radius: (this.body.shapes[0] as phys.Sphere).radius,
				},
			],
		};
	}
}
