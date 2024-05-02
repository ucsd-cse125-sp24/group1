import { Entity } from "../Entity";
import * as phys from "cannon-es";
import type { ModelId } from "../../../common/models";
import { SerializedEntity } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

export abstract class InteractableEntity extends Entity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];
	
	
	constructor(name: string, model: ModelId[] = []) {
		super(name, model);

		this.type = "interactable-entity";
		this.name = name;
		this.model = model;
		this.body = new phys.Body();

	}

    abstract interact(Player: PlayerEntity): void;
	
	abstract serialize(): SerializedEntity;

}
