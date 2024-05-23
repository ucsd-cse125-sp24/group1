import { Entity, Tag } from "../Entity";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

import { Item } from "./Item";
import { Game } from "../../Game";

export abstract class InteractableEntity extends Entity {
	constructor(game: Game, model: EntityModel[] = [], tags: Tag[] = []) {
		super(game, model, ["interactable", ...tags]);
	}

	abstract interact(Player: PlayerEntity): void | Item;
}
