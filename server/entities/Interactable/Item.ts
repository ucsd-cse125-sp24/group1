import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Tag } from "../Entity";
import { ItemMaterial } from "../../materials/SourceMaterials";
import { InteractableEntity } from "./InteractableEntity";

export class Item extends InteractableEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: EntityModel[];
	radius: number;
	heldBy: PlayerEntity | null;

	// shape
	sphere: phys.Sphere;

	/**
	 *
	 * Tag should be a Tag type! For creating an item, it should only realistically be a resource or a tool!
	 *
	 * @param name
	 * @param type
	 * @param radius
	 * @param pos
	 * @param model
	 * @param tag
	 */
	constructor(name: string, type: string, radius: number, pos: Vector3, model: EntityModel[] = [], tag: Tag) {
		super(name, model, [tag]);

		//TODO: ADD A MATERIAL FOR COLLISION

		this.type = type;
		this.name = name;
		this.model = model;
		this.radius = radius;
		this.heldBy = null;

		this.tags.add("item");

		this.tags.add(tag);

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			material: ItemMaterial,
			collisionFilterGroup: this.getBitFlag(), // ALWAYS SET TAGS BEFORE THIS!!
		});

		this.sphere = new phys.Sphere(this.radius);

		this.body.addShape(this.sphere);

		this.body.position = new phys.Vec3(...pos);
	}

	bind(player: PlayerEntity) {
		this.heldBy = player;
		this.heldBy.itemInHands = this;
	}

	unbind() {
		if (this.heldBy) this.heldBy.itemInHands = null;
		this.heldBy = null;
	}

	interact(player: PlayerEntity) {
		if (this.heldBy) {
			this.unbind(); // You prob need some COFFEE
			// this.body.mass = 1.0;
			if (this.heldBy == player) {
				this.throw(player.lookDir);
				return;
			}
		}
		//checks the type of the player entity

		//if a hero, then makes the item's position locked into the player's hands
		//turns collider off, possibly

		if (player.type === "player-hero") {
			console.log("touched an item, scandalous");
			this.bind(player);
			// this.body.mass = 0;
		} else if (player.type === "player-boss") {
		}

		//if a boss, do some sabotage!
		//TBD
	}

	throw(direction: phys.Vec3) {
		//unlock it from the player's hands
		let throwForce = direction;
		throwForce.normalize();
		this.body.applyForce(throwForce);
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
		};
	}
}
