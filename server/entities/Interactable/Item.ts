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
	constructor(game: Game, type: ItemType, pos: Vector3, model: EntityModel[] = [], tag: Tag) {
		super(game, model, [tag]);

		//TODO: ADD A MATERIAL FOR COLLISION

		this.type = type;
		this.model = model;
		this.heldBy = null;

		this.radius = 0.5;

		this.tags.add("item");
		this.tags.add(tag);


		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			material: ItemMaterial,
			collisionFilterGroup: this.getBitFlag(), // ALWAYS SET TAGS BEFORE THIS!!
		});


		let shape = new phys.Shape();

		const hasFlatCollider: Record<ItemType, boolean | undefined> = {
			axe: true, 
			knife: true,
			pickaxe: true,
			shears: true,
			sword: true, 

			bow: false,
			gamer_bow: false,
			gamer_sword: false,
			iron: false,
			magic_sauce: false,
			mushroom: false,
			raw_iron: false,
			string: false,
			wood: false
		} 

		const hasSphereCollider: Record<ItemType, boolean | undefined> = {
			raw_iron: true,
			string: true,
			magic_sauce: true,
			mushroom: true,

			axe: false, 
			knife: false,
			pickaxe: false,
			shears: false,
			sword: false, 

			bow: false,
			gamer_bow: false,
			gamer_sword: false,
			iron: false,
			wood: false
		} 

		//everything else will have a cylindrical collider
	
		let rot = new phys.Quaternion(0, 0, 0, 1);

		if(hasFlatCollider[type]) {
			shape = new phys.Box(new phys.Vec3(.3, 1.0, .1));
		} else if(hasSphereCollider[type]) {
			shape = new phys.Sphere(0.5);
		} else {
			shape = new phys.Cylinder(0.5, 0.5, 1.0, 12);
			rot.setFromEuler(0, 0, 1.5707);
		}

		this.body.addShape(shape, new phys.Vec3(0, .5, 0), rot);

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
		this.body.applyImpulse(throwForce.scale(20));
	}

	toString(): string {
		return super.toString(`[${this.type}]`);
	}
}
