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

		let success = true;

		console.log("ItemList, then entity name, then recipes:")
		console.log('| itemList', this.itemList);
		console.log('| entity name',otherEntity.name);
		console.log('| recipes',this.recipes);

		if (otherEntity instanceof Item) {

			otherEntity.body.position = new phys.Vec3(99, 0, 99); //sent to the shadow realm
			otherEntity.body.mass = 0; //making it static
			

			
			if (otherEntity.tags.has("resource")) {
				//check if it's a possible recipe
				let EntityName = otherEntity.name;

				let currentResourceCount = 0;
				let resourceCount = 0;
				for(let i = 0; i < this.itemList.length; i ++) {
					if(this.itemList[i].name == EntityName) {
						resourceCount ++;
					}
				}

				console.log("itemList has " + resourceCount + " " + EntityName);

				for(let i = 0; i < this.recipes.length; i++) {
					//for each recipe
					for(let j = 0; j < this.recipes[i].length; j++) {
						if(EntityName == this.recipes[i][j] ) {
							currentResourceCount++;
						}
					}

					console.log("recipe" + i + "has " + currentResourceCount + " " + EntityName);

					if(currentResourceCount > resourceCount) {
						//should be added
						console.log("Oh, nice! Item should be added to the list.");
						otherEntity.body.position = new phys.Vec3(99, 0, 99); // the bone zone
						this.itemList.push(otherEntity);
						break;
					}
					
					currentResourceCount = 0;
				}

			} else if (otherEntity.tags.has("tool")) {
				for(let i = 0; i < this.recipes.length; i++) {

					if(this.itemList.length == this.recipes[i].length) {

						

						for(let j = 0; j < this.recipes[i].length; j++) {

							if(this.itemList[j].name != this.recipes[i][j]) {

								success = false;
							}
						}
					}

					
				}


				if(success) {
					for(let i = 0; i < this.itemList.length; i++) {
						//fully clear the item list
						this.itemList.pop();
					}

					console.log("deleted all the items");
					console.log("should now spit out an upgraded item TODO");
					//SHOOT OUT THE UPGRADED ITEM
				}

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
