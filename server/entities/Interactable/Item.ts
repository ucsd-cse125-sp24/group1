import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import type { ModelId } from "../../../common/models";
import { SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { InteractableEntity } from "./InteractableEntity";
import { PlayerEntity } from "../PlayerEntity";
import { HeroEntity } from "../HeroEntity";
import { BossEntity } from "../BossEntity";

export class Item extends InteractableEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];
	radius: number;

	radius: number;

	// shape
	sphere: phys.Sphere;

	constructor(name: string, radius: number, pos: Vector3, model: ModelId[] = [], tag: string) {
		super(name, model);

		//TODO: ADD A MATERIAL FOR COLLISION

		this.type = "item";
		this.name = name;
		this.model = model;
		this.radius = radius;
		this.radius = radius;

		this.tags.add(tag);

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
		});

		this.sphere = new phys.Sphere(this.radius);

		this.body.addShape(this.sphere);

		this.body.position = new phys.Vec3(...pos);
	}

	interact(player: PlayerEntity) {
		//checks the type of the player entity

		//if a hero, then makes the item's position locked into the player's hands
		//turns collider off, possibly

		if (player instanceof HeroEntity) {
		} else if (player instanceof BossEntity) {
		}

		//if a boss, do some sabotage!
		//TBD
	}

	throw(direction: Vector3) {
		//unlock it from the player's hands
		let throwForce = new phys.Vec3(...direction);
		throwForce.normalize();
		this.body.applyForce(throwForce);
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
					radius: this.sphere.radius,
					offset: [0, 0, 0],
				},
			],
		};
	}
}
