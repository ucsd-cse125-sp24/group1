import { Entity, Tag } from "../Entity";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

import { Item } from "./Item";

export abstract class InteractableEntity extends Entity {
	constructor(name: string, model: EntityModel[] = [], tags: Tag[] = []) {
		super(name, model, ["interactable", ...tags]);
	}

	abstract interact(Player: PlayerEntity): void | Item;
	abstract serialize(): SerializedEntity;
}
