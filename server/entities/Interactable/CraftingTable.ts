import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Entity } from "../Entity";
import { Game } from "../../Game";
import { InteractableEntity } from "./InteractableEntity";
import { Item } from "./Item";

export type Recipe = { ingredients: string[]; output: string };

export class CraftingTable extends InteractableEntity {
	body: phys.Body;
	halfExtent: number;
	model: EntityModel[];

	itemList: Item[];
	recipes: Recipe[];

	// shape
	box: phys.Box;

	static nameCounter: 0;

	constructor(game: Game, pos: Vector3, model: EntityModel[] = [], recipes: Recipe[]) {
		super(game, model);

		this.type = "crafting-table";
		this.model = model;
		this.itemList = [];
		this.recipes = recipes;
		this.halfExtent = 0.75;

		this.body = new phys.Body({
			mass: 1000.0,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
			collisionFilterGroup: this.getBitFlag(),
		});

		this.box = new phys.Box(new phys.Vec3(this.halfExtent, this.halfExtent, this.halfExtent));

		this.body.addShape(this.box);
	}

	interact(player: PlayerEntity) {
		//should spawn the top item in the array!
		console.log("ouch");

		let item = this.itemList.pop();

		if (item instanceof Item) {
			item.throw(new phys.Vec3(0, 1, 1));
		} // if there's no items in the array do nothing ig
	}

	onCollide(otherEntity: Entity): void {
		let success = false;
		CraftingTable.nameCounter++;

		if (otherEntity instanceof Item) {
			//console.log("ItemList, then entity name, then recipes:");
			//console.log("| itemList", this.itemList);
			//console.log("| entity name", otherEntity.name);
			//console.log("| recipes", this.recipes);

			if (otherEntity.tags.has("resource")) {
				//check if it's a possible recipe
				let EntityType = otherEntity.type;

				let currentResourceCount = 0;
				let resourceCount = 0;

				for (let i = 0; i < this.itemList.length; i++) {
					if (this.itemList[i].type == EntityType) {
						resourceCount++;
					}
				}

				console.log("itemList has " + resourceCount + " " + EntityType);

				for (let i = 0; i < this.recipes.length; i++) {
					//for each recipe

					for (let j = 0; j < this.recipes[i].ingredients.length; j++) {
						if (EntityType == this.recipes[i].ingredients[j]) {
							currentResourceCount++;
						}
					}

					console.log("recipe" + i + "has " + currentResourceCount + " " + EntityType);

					if (currentResourceCount > resourceCount) {
						//should be added
						console.log("Item should be deleted!");

						this.itemList.push(otherEntity);
						this.game.addToDeleteQueue(otherEntity.id);

						return;
					}

					currentResourceCount = 0;
				}
			} else if (otherEntity.tags.has("tool")) {
				for (let i = 0; i < this.recipes.length; i++) {
					if (this.itemList.length == this.recipes[i].ingredients.length) {
						success = true;

						for (let j = 0; j < this.recipes[i].ingredients.length; j++) {
							if (this.itemList[j].type != this.recipes[i].ingredients[j]) {
								success = false;
							}
						}

						if (success) {
							for (let j = 0; j < this.itemList.length; j++) {
								//fully clear the item list
								this.itemList.pop();
							}
							console.log("deleted all the items");

							let name = this.recipes[i].output + CraftingTable.nameCounter;
							let result = new Item(
								this.game,
								this.recipes[i].output,
								0.5,
								this.getPos(),
								[{ modelId: "fish1" }],
								"resource",
							);
							this.game.addToCreateQueue(result);

							console.log("Should spit out an item, NOT FINISHED");
							return;
						}
					}
				}

				if (success) {
					for (let i = 0; i < this.itemList.length; i++) {
						//fully clear the item
						let item = this.itemList.pop();

						if (item) {
							this.game.addToDeleteQueue(item.id);
						}
					}

					console.log("deleted all the items");
					console.log("should now spit out an upgraded item TODO");

					//SHOOT OUT THE UPGRADED ITEM
				}
			}
		}
	}
}
