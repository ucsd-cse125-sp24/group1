import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Tag } from "../Entity";
import { ItemMaterial } from "../../materials/SourceMaterials";
import { Game } from "../../Game";
import { InteractableEntity } from "./InteractableEntity";

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
	| "armor"
	| "wood";

const modelForItemType: Record<ItemType, EntityModel[]> = {
	armor: [{ modelId: "armor", scale: 0.5 }],
	axe: [{ modelId: "axe", scale: 0.5 }],
	bow: [{ modelId: "bow", scale: 0.5 }],
	gamer_bow: [{ modelId: "gamer_bow", scale: 0.5 }],
	gamer_sword: [{ modelId: "gamer_sword", scale: 0.5 }],
	iron: [{ modelId: "iron", scale: 0.5 }],
	knife: [{ modelId: "knife", scale: 0.5 }],
	magic_sauce: [{ modelId: "magic_sauce", scale: 0.5 }],
	mushroom: [{ modelId: "mushroom", scale: 0.5 }],
	pickaxe: [{ modelId: "pickaxe", scale: 0.5 }],
	raw_iron: [{ modelId: "raw_iron", scale: 0.5 }],
	shears: [{ modelId: "shears", scale: 0.5 }],
	string: [{ modelId: "string", scale: 0.5 }],
	sword: [{ modelId: "sword", scale: 0.5 }],
	wood: [{ modelId: "wood", scale: 0.5 }],
};
const colliderShapeForItemType: Record<ItemType, phys.Shape> = {
	armor: new phys.Sphere(0.5),
	axe: new phys.Box(new phys.Vec3(0.3, 1, 0.1)),
	bow: new phys.Cylinder(0.5, 0.5, 1.0, 12),
	gamer_bow: new phys.Cylinder(0.5, 0.5, 1.0, 12),
	gamer_sword: new phys.Cylinder(0.5, 0.5, 1.0, 12),
	iron: new phys.Cylinder(0.5, 0.5, 1.0, 12),
	knife: new phys.Box(new phys.Vec3(0.3, 1, 0.1)),
	magic_sauce: new phys.Sphere(0.5),
	mushroom: new phys.Sphere(0.5),
	pickaxe: new phys.Box(new phys.Vec3(0.3, 1, 0.1)),
	raw_iron: new phys.Sphere(0.5),
	shears: new phys.Box(new phys.Vec3(0.3, 0.5, 0.1)),
	string: new phys.Sphere(0.5),
	sword: new phys.Box(new phys.Vec3(0.3, 1, 0.1)),
	wood: new phys.Cylinder(0.5, 0.5, 1.0, 12),
};

export class Item extends InteractableEntity {
	type: ItemType;
	body: phys.Body;
	model: EntityModel[];
	heldBy: PlayerEntity | null;
	/**
	 * This is to prevent items ejected by a crafting table from immediately being
	 * reabsorbed.
	 */
	canBeAbsorbedByCraftingTable = false;

	radius: number;

	/**
	 * Tag should be a Tag type! For creating an item, it should only realistically be a resource or a tool!
	 */
	constructor(game: Game, type: ItemType, pos: Vector3, tag: Tag) {
		super(game, modelForItemType[type], [tag]);

		//TODO: ADD A MATERIAL FOR COLLISION

		this.type = type;
		this.model = modelForItemType[type];
		this.heldBy = null;

		this.radius = 0.5;

		this.tags.add("item");
		this.tags.add(tag);

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			material: ItemMaterial,
			shape: colliderShapeForItemType[type],
			collisionFilterGroup: this.getBitFlag(), // ALWAYS SET TAGS BEFORE THIS!!
		});
	}

	/**
	 * Attach an object to the player's hands.
	 */
	bind(player: PlayerEntity) {
		this.heldBy = player;
		this.heldBy.itemInHands = this;
		this.body.removeShape(colliderShapeForItemType[this.type]);
	}

	unbind() {
		if (this.heldBy) this.heldBy.itemInHands = null;
		this.heldBy = null;
		this.body.addShape(colliderShapeForItemType[this.type]);
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

		if (!player.isBoss) {
			this.bind(player);
			this.game.playSound("pickup", player.getPos());
			// Should this be moved to `bind`?
			this.canBeAbsorbedByCraftingTable = true;
			// this.body.mass = 0;
		} else {
		}

		//if a boss, do some sabotage!
		//TBD
	}

	throw(direction: phys.Vec3) {
		//unlock it from the player's hands
		let throwForce = direction;
		throwForce.normalize();
		this.body.applyImpulse(throwForce.scale(50 * this.body.mass));
	}

	toString(): string {
		return super.toString(`[${this.type}]`);
	}
}
