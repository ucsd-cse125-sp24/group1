import * as phys from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { Action, EntityModel, SerializedEntity, Use } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";
import { Entity } from "../Entity";
import { Game } from "../../Game";
import { InteractableEntity } from "./InteractableEntity";
import { Item, ItemType } from "./Item";
import { GroundMaterial, SpawnerMaterial } from "../../materials/SourceMaterials";
import { Collider, addColliders } from "../../lib/Collider";

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

export type CrafterType = "furnace" | "weapons" | "fletching" | "magic_table";

let fullSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI);
let halfSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI / 2);
let quarterSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI / 4);
const modelForCrafterType: Record<CrafterType, EntityModel[]> = {
	furnace: [{ modelId: "furnace", scale: 0.5, offset: [0, -1.5, 0] }],
	weapons: [{ modelId: "anvil", offset: [0, -1.25, 0] }],
	fletching: [{ modelId: "work_station", offset: [0, -0.65, 0] }],
	magic_table: [{ modelId: "bottle_table", offset: [0, -0.55, 0] }],
};
const colliderShapeForCrafterType: Record<CrafterType, Collider[]> = {
	furnace: [
		{ shape: new phys.Box(new phys.Vec3(1.9, 1.1, 2.2)), offset: new phys.Vec3(0.2, -0.5, 0) },
		{ shape: new phys.Box(new phys.Vec3(1.2, 2.2, 2.2)), offset: new phys.Vec3(-0.5, 1, 0) },
	],
	weapons: [
		{ shape: new phys.Box(new phys.Vec3(1.3, 1.45, 1.5)) },
		{ shape: new phys.Box(new phys.Vec3(1.3, 0.5, 2.7)), offset: new phys.Vec3(0, 0.95, 0) },
	],
	fletching: [{ shape: new phys.Box(new phys.Vec3(1.3, 1, 2.5)) }],
	magic_table: [{ shape: new phys.Box(new phys.Vec3(1.3, 1, 2.5)) }],
};

export class CraftingTable extends InteractableEntity {
	body: phys.Body;
	isStatic = true;
	isFurnace: boolean;

	/** Items stored in the crafting table */
	itemList: Set<Item>;
	/** Recipes that the crafting table can perform */
	recipes: Recipe[];
	/** List of potential ingredients for recipes */
	ingredients: ItemType[];

	// eject direction
	#ejectDir: phys.Vec3;

	constructor(
		game: Game,
		pos: Vector3,
		type: CrafterType,
		recipes: Recipe[],
		ejectDir: phys.Vec3 = new phys.Vec3(0, 0, 0),
	) {
		super(game, modelForCrafterType[type]);

		this.itemList = new Set();
		this.recipes = recipes;
		this.ingredients = recipes.flatMap((recipe) => recipe.ingredients);
		console.log(type + ": " + this.ingredients);
		this.isFurnace = type === "furnace";

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			material: GroundMaterial, // temp fix, depends on the item,
			collisionFilterGroup: this.getBitFlag(),
		});

		addColliders(this.body, colliderShapeForCrafterType[type]);

		if (ejectDir.length() == 0) {
			this.#ejectDir = new phys.Vec3(...pos).negate();
			this.#ejectDir.set(this.#ejectDir.x, 0, this.#ejectDir.z);
			this.#ejectDir.normalize();
		} else {
			this.#ejectDir = ejectDir.clone();
		}
	}

	#lastMessage = "";

	/**
	 * Checks `itemList` against the list of `recipes`. There are three cases:
	 * - A recipe has been satisfied, so produce an output.
	 * - There are some recipes that could be satisfied with more items, so keep
	 *   waiting for items.
	 * - The items cannot satisfy anything, so eject them all.
	 */
	#checkRecipes(): RecipeCheckResult {
		const items = Array.from(this.itemList, (item) => item.type);
		let potentiallySatisfiable = false;
		for (const { ingredients, output } of this.recipes) {
			const unused = [...items];
			let missingIngredient = false;
			for (const ingredient of ingredients) {
				// Remove ingredient from `unused` if it could be used for the recipe
				const index = unused.indexOf(ingredient);
				if (index === -1) {
					missingIngredient = true;
					continue;
				}
				unused.splice(index, 1);
			}
			// Extra items are prohibited
			if (missingIngredient || unused.length > 0) {
				// Extra items would prevent this recipe from ever being satisfied,
				// even if more ingredients are added
				if (unused.length === 0) {
					potentiallySatisfiable = true;
					this.#lastMessage = `potentially satisfiable because HAVE[${items.join(" ")}] NEED[${ingredients.join(" ")}]`;
				} else {
					this.#lastMessage = `not potentially satisfiable because EXTRA[${unused.join(" ")}]`;
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
		// launch toward spawn but a little randomized
		const dir = this.#ejectDir.clone();
		dir.vadd(new phys.Vec3((Math.random() - 0.5) * 0.2, Math.random() * 0.2 + 0.9, (Math.random() - 0.5) * 0.2));
		dir.normalize();
		item.body.position = this.body.position.vadd(new phys.Vec3(0, 2, 0)).vadd(dir.scale(2));
		this.game.addToCreateQueue(item);

		// console.log(this.body.position + ": " + dir);

		item.throw(dir.scale(65));
	}

	interact(player: PlayerEntity): Action<Use> | null {
		//should spawn the top item in the array!

		return {
			type: "pop-crafter",
			commit: () => {
				let item = Array.from(this.itemList)[0];

				if (item) {
					this.itemList.delete(item);
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
			if (this.itemList.has(otherEntity)) {
				return;
			}
			otherEntity.canBeAbsorbedByCraftingTable = false;

			// console.log(this.ingredients);
			// console.log(otherEntity.type);

			// Absorb the item
			this.itemList.add(otherEntity);
			this.game.addToDeleteQueue(otherEntity.id);

			const result = this.#checkRecipes();
			if (result.type === "satisfied") {
				// Delete ingredients
				this.itemList = new Set();
				console.log("crafted ", result.output);
				this.#eject(new Item(this.game, result.output, this.getPos(), "resource"));
				this.game.playSound("craftingSuccess", this.getPos());
			} else if (result.type === "unsatisfiable") {
				for (const item of this.itemList) {
					this.#eject(item);
				}
				this.itemList = new Set();
				this.game.playSound("craftingEjectAll", this.getPos());
			} else {
				this.game.playSound("craftingPickup", this.getPos());
			}
		}
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			model: [
				...this.model,
				...Array.from(this.itemList, (item, i) =>
					item.model.map((model): EntityModel => {
						if (typeof model === "string") {
							model = { modelId: model };
						}
						const [x, y, z] = model.offset ?? [0, 0, 0];
						return {
							...model,
							offset: [x + (i - (this.itemList.size - 1) / 2), y + 3 + Math.sin(Date.now() / 500) * 0.2, z],
							rotation: new phys.Quaternion()
								.setFromAxisAngle(phys.Vec3.UNIT_Y, Date.now() / (2345 + Math.sin(i) * 300))
								.toArray(),
						};
					}),
				).flat(),
				{ text: this.#lastMessage, offset: [0, 2, 0], height: 0.1 },
				{ text: Array.from(this.itemList, (item) => item.type).join(" "), offset: [0, 1.5, 0], height: 0.1 },
			],
			light: this.isFurnace
				? {
						color: [30 / 360, 0.8, 1 + Math.sin(Date.now() / 1000) * 0.2],
						falloff: 5,
						offset: [-0.5, 1.2, 0],
						willMove: false,
					}
				: undefined,
		};
	}
}
