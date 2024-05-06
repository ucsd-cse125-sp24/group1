import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import type { ModelId } from "../../../common/models";
import { SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { InteractableEntity } from "./InteractableEntity";

export abstract class Item extends InteractableEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];
	radius: number;

	// shape
	sphere: phys.Sphere;

	constructor(name: string, radius: number, pos: Vector3, model: ModelId[] = []) {
		super(name, model);

		this.type = "item";
		this.name = name;
		this.model = model;
		this.radius = radius;

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
		});

		this.sphere = new phys.Sphere(this.radius);

		this.body.addShape(this.sphere);
	}

	abstract interact(player: PlayerEntity): void;

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "sphere", //capsule Bot
					radius: this.sphere.radius,
					offset: [0, 0, 0],
				},
			],
		};
	}
}
