import * as phys from "cannon-es";
import { Entity } from "../Entity";
import type { ModelId } from "../../../common/models";
import { SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

import { Item } from "./Item";

export abstract class InteractableEntity extends Entity {
	constructor(name: string, model: ModelId[] = []) {
		super(name, model);
	}

	abstract interact(Player: PlayerEntity): void | Item;
	abstract serialize(): SerializedEntity;
}
