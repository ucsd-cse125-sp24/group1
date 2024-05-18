import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { InteractableEntity } from "./InteractableEntity";
import { Tag } from "../Entity";

export class Item extends InteractableEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: EntityModel[];
	radius: number;
	heldBy: PlayerEntity | null;

	// shape
	sphere: phys.Sphere;

	constructor(name: string, radius: number, pos: Vector3, model: EntityModel[] = [], tag: Tag) {
		super(name, model, [tag]);

		//TODO: ADD A MATERIAL FOR COLLISION

		this.type = "item";
		this.name = name;
		this.model = model;
		this.radius = radius;
		this.radius = radius;
		this.heldBy = null;

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
			collisionFilterGroup: this.getBitFlag(), // ALWAYS SET TAGS BEFORE THIS!!
		});

		this.sphere = new phys.Sphere(this.radius);

		this.body.addShape(this.sphere);

		this.body.position = new phys.Vec3(...pos);
	}

	interact(player: PlayerEntity) {
		if (this.heldBy) this.heldBy.itemInHands = null; // You prob need some COFFEE
		//checks the type of the player entity

		//if a hero, then makes the item's position locked into the player's hands
		//turns collider off, possibly

		if (player.type === "player-hero") {
			console.log("touched an item, scandalous");
			player.itemInHands = this;
			this.body.mass = 0;
		} else if (player.type === "player-boss") {
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
