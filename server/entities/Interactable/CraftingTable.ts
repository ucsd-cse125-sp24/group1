import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { Action, EntityModel, SerializedEntity, Use } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Entity } from "../Entity";
import { Game } from "../../Game";
import { InteractableEntity } from "./InteractableEntity";
import { Item, ItemType } from "./Item";

export type Recipe = { ingredients: ItemType[]; output: ItemType };

type RecipeCheckResult =
	| {
			/** A recipe has been satisfied */
			type: "satisfied";
			output: ItemType;
	  }
	| {
			/** There are recipes that can be satisfied with more items */
			type: "need-more-items";
	  }
	| {
			/** No recipes can be satisfied even with more items */ type: "unsatisfiable";
	  };

export class CraftingTable extends InteractableEntity {
	body: phys.Body;
	halfExtent: number;
	model: EntityModel[];
	isStatic = true;

	/** Items stored in the crafting table */
	itemList: Item[];
	/** Recipes that the crafting table can perform */
	recipes: Recipe[];
	/** List of potential ingredients for recipes */
	ingredients: ItemType[];

	// shape
	box: phys.Box;

	constructor(game: Game, pos: Vector3, model: EntityModel[] = [], recipes: Recipe[]) {
		super(game, model);

		this.model = model;
		this.itemList = [];
		this.recipes = recipes;
		this.ingredients = recipes.flatMap((recipe) => recipe.ingredients);
		this.halfExtent = 1.5;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			//material: depends on the item,
			collisionFilterGroup: this.getBitFlag(),
		});

		this.box = new phys.Box(new phys.Vec3(this.halfExtent, this.halfExtent, this.halfExtent));

		this.body.addShape(this.box);
	}

	/**
	 * Checks `itemList` against the list of `recipes`. There are three cases:
	 * - A recipe has been satisfied, so produce an output.
	 * - There are some recipes that could be satisfied with more items, so keep
	 *   waiting for items.
	 * - The items cannot satisfy anything, so eject them all.
	 */
	#checkRecipes(): RecipeCheckResult {
		const items = this.itemList.map((item) => item.type);
		let potentiallySatisfiable = false;
		for (const { ingredients, output } of this.recipes) {
			const unused = [...items];
			let missingIngredient = false;
			for (const ingredient of ingredients) {
				// Remove ingredient from `unused` if it could be used for the recipe
				const index = unused.indexOf(ingredient);
				if (index === -1) {
					missingIngredient = true;
				}
				unused.splice(index, 1);
			}
			// Extra items are prohibited
			if (missingIngredient || unused.length > 0) {
				// Extra items would prevent this recipe from ever being satisfied,
				// even if more ingredients are added
				if (unused.length === 0) {
					potentiallySatisfiable = true;
				}
			} else {
				return { type: "satisfied", output };
			}
		}
		return potentiallySatisfiable ? { type: "need-more-items" } : { type: "unsatisfiable" };
	}

	/**
	 * Launch an item out of the crafting table.
	 *
	 * NOTE: This method does not remove the item from `itemList`.
	 */
	#eject(item: Item) {
		console.log("Ejecting", item.type);
		// Prevent the item from being re-absorbed immediately
		item.canBeAbsorbedByCraftingTable = false;
		// Move the item to the top of the crafting table (its previous position was
		// wherever it was before it got absorbed)
		item.body.position = this.body.position.vadd(new phys.Vec3(0, 1, 0));
		this.game.addToCreateQueue(item);
		// TODO: randomize launch angle? or launch towards player?
		item.throw(new phys.Vec3(-20, 30, -50));
	}

	interact(player: PlayerEntity): Action<Use> | null {
		//should spawn the top item in the array!

		return {
			type: "pop-crafter",
			commit: () => {
				let item = this.itemList.pop();

				if (item) {
					this.#eject(item);
					this.game.playSound("popCrafting", this.getPos());
				} else {
					// if there's no items in the array do nothing ig
					this.game.playSound("popCraftingFail", this.getPos());
				}
			},
		};
	}

	onCollide(otherEntity: Entity): void {
		if (otherEntity instanceof Item) {
			if (!otherEntity.canBeAbsorbedByCraftingTable) {
				return;
			}
			if (!this.ingredients.includes(otherEntity.type)) {
				return;
			}

			// Absorb the item
			this.itemList.push(otherEntity);
			this.game.addToDeleteQueue(otherEntity.id);

			const result = this.#checkRecipes();
			if (result.type === "satisfied") {
				// Delete ingredients
				this.itemList = [];
				console.log("crafted ", result.output);
				this.#eject(new Item(this.game, result.output, this.getPos(), "resource"));
				this.game.playSound("craftingSuccess", this.getPos());
			} else if (result.type === "unsatisfiable") {
				for (const item of this.itemList) {
					this.#eject(item);
				}
				this.itemList = [];
				this.game.playSound("craftingEjectAll", this.getPos());
			} else {
				this.game.playSound("craftingPickup", this.getPos());
			}
		}
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			model: [...this.model, ...this.itemList.flatMap((item) => item.model)],
		};
	}
}
