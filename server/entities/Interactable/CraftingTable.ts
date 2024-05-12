import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import type { ModelId } from "../../../common/models";
import { SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Entity } from "../Entity";
import { TheWorld } from "../../physics";
import { InteractableEntity } from "./InteractableEntity";
import { Item } from "./Item";

export class CraftingTable extends InteractableEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];
	radius: number;

	//TODO: remake to a stack
	itemList: Item[];

	// shape
	sphere: phys.Sphere;


    
	constructor(name: string, pos: Vector3, model: ModelId[] = [], recipes: string[][]) {
		super(name, model);

		this.type = "crafting-table";
		this.name = name;
		this.model = model;
		this.itemList = [];

		//TODO: change this to a cube collider
		this.radius = 1.0;

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
		});

		this.sphere = new phys.Sphere(this.radius);

		this.body.addShape(this.sphere);
	}

	interact(player: PlayerEntity) {
		//should spawn the top item in the array!

		let item = this.itemList.pop();

		if (item instanceof Item) {
			item.throw([0, 1, 1]);
		} // if there's no items in the array do nothing ig
	}

	onCollide(otherEntity: Entity): void {

		
		
		if (otherEntity instanceof Item) {

			otherEntity.removeFromWorld(TheWorld);

			/*
			if (otherEntity.tags.has("resource")) {
				//check if it's a possible recipe

				//if it is,
				otherEntity.removeFromWorld(TheWorld);
				this.itemList.push(otherEntity);
			} else if (otherEntity.tags.has("tool")) {
				//check if the crafting table has all the ingredients for a recipe
				//check if this is the right tool
				//if it is? LAUNCH BOTH THE TOOL AND THE CRAFTED INGREDIENT
			}
			*/
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
					type: "sphere", //capsule Bot
					radius: this.sphere.radius,
					offset: [0, 0, 0],
				},
			],
		};
	}
}
