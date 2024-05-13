import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Entity } from "../Entity";
import { TheWorld } from "../../physics";
import { InteractableEntity } from "./InteractableEntity";
import { Item } from "./Item";

export class CraftingTable extends InteractableEntity {
	body: phys.Body;
	halfExtent: number;
	model: EntityModel[];

	itemList: Item[];
	recipes: string[][];

	// shape
	box: phys.Box;

	constructor(name: string, pos: Vector3, model: EntityModel[] = [], recipes: string[][]) {
		super(name, model);

		this.type = "crafting-table";
		this.name = name;
		this.model = model;
		this.itemList = [];
		this.recipes = recipes;
		this.halfExtent = 0.75;

		this.body = new phys.Body({
			mass: 10.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
			collisionFilterGroup: Entity.INTERACTABLE_COLLISION_GROUP,
		});

		this.box = new phys.Box(new phys.Vec3(this.halfExtent, this.halfExtent, this.halfExtent));

		this.body.addShape(this.box);
	}

	interact(player: PlayerEntity) {
		//should spawn the top item in the array!
		console.log("ouch");
		
		let item = this.itemList.pop();

		if (item instanceof Item) {
			item.throw([0, 1, 1]);
		} // if there's no items in the array do nothing ig
	}

	onCollide(otherEntity: Entity): void {

		
		if (otherEntity instanceof Item) {

			otherEntity.body.position = new phys.Vec3(99, 0, 99); //sent to the shadow realm
			otherEntity.body.mass = 0 //making it static
			

			
			if (otherEntity.tags.has("resource")) {
				//check if it's a possible recipe
				let EntityName = otherEntity.name;


				//TODO: tyler work
				for(let i = 0; i < this.recipes.length; i++) {

					

				}

				

				//if it is,
				//otherEntity.removeFromWorld(TheWorld);
				//this.itemList.push(otherEntity);

			} else if (otherEntity.tags.has("tool")) {
				//check if the crafting table has all the ingredients for a recipe
				//check if this is the right tool
				//if it is? LAUNCH BOTH THE TOOL AND THE CRAFTED INGREDIENT
			}
			
		}
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "box", //capsule Bot
					size: [this.halfExtent, this.halfExtent, this.halfExtent],
					offset: [0, 0, 0],
				},
			],
		};
	}
}
