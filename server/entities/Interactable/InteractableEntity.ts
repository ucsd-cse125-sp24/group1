import { Vec3 } from "cannon-es";
import { Entity, Tag } from "../Entity";
import { EntityModel } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

import { Game } from "../../Game";

export abstract class InteractableEntity extends Entity {
	constructor(game: Game, model: EntityModel[] = [], tags: Tag[] = []) {
		super(game, model, ["interactable", ...tags]);
	}

	hit(player: PlayerEntity) {
		// By default, just hit the object back a bit
		this.body.applyImpulse(new Vec3(player.lookDir.x * 5, Math.abs(player.lookDir.y) * 5 + 5, player.lookDir.z * 5));
		this.game.playSound("defaultHit", this.getPos());
	}

	abstract interact(player: PlayerEntity): void;
}
