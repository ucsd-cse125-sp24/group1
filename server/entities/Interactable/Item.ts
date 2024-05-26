import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Tag } from "../Entity";
import { ItemMaterial } from "../../materials/SourceMaterials";
import { InteractableEntity } from "./InteractableEntity";
import { Game } from "../../Game";
import { HeroEntity } from "../HeroEntity";
import { BossEntity } from "../BossEntity";

export type ItemType =
	| "axe"
	| "bow"
	| "gamer_bow"
	| "gamer_sword"
	| "iron"
	| "knife"
	| "magic_sauce"
	| "mushroom"
	| "pickaxe"
	| "raw_iron"
	| "shears"
	| "string"
	| "sword"
	| "wood";

export class Item extends InteractableEntity {
	type: ItemType;
	body: phys.Body;
	model: EntityModel[];
	radius: number;
	heldBy: PlayerEntity | null;
	/**
	 * This is to prevent items ejected by a crafting table from immediately being
	 * reabsorbed.
	 */
	canBeAbsorbedByCraftingTable = false;

	// shape
	sphere: phys.Sphere;

	/**
	 * Tag should be a Tag type! For creating an item, it should only realistically be a resource or a tool!
	 */
	constructor(game: Game, type: ItemType, radius: number, pos: Vector3, model: EntityModel[] = [], tag: Tag) {
		super(game, model, [tag]);

		//TODO: ADD A MATERIAL FOR COLLISION

		this.type = type;
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

	/**
	 * Attach an object to the player's hands.
	 */
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
			const heldBy = this.heldBy;
			this.unbind(); // You prob need some COFFEE
			// this.body.mass = 1.0;
			if (heldBy == player) {
				this.throw(player.lookDir);
				this.game.playSound("throw", player.getPos());
				return;
			}
		}
		//checks the type of the player entity

		//if a hero, then makes the item's position locked into the player's hands
		//turns collider off, possibly

		if (player instanceof HeroEntity) {
			console.log("touched an item, scandalous");
			this.bind(player);
			this.game.playSound("pickup", player.getPos());
			// Should this be moved to `bind`?
			this.canBeAbsorbedByCraftingTable = true;
			// this.body.mass = 0;
		} else if (player instanceof BossEntity) {
		}

		//if a boss, do some sabotage!
		//TBD
	}

	throw(direction: phys.Vec3) {
		//unlock it from the player's hands
		let throwForce = direction;
		throwForce.normalize();
		this.body.applyForce(throwForce.scale(600));
	}
}
