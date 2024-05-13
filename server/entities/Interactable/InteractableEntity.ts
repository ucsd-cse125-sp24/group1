import { Entity } from "../Entity";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

import { Item } from "./Item";

export abstract class InteractableEntity extends Entity {
	constructor(name: string, model: EntityModel[] = []) {
		super(name, model);
	}

	abstract interact(Player: PlayerEntity): void | Item;
	abstract serialize(): SerializedEntity;
}
