import { Vec3 } from "cannon-es";
import { Entity, Tag } from "../Entity";
import { Action, Attack, EntityModel, Use } from "../../../common/messages";
import { PlayerEntity } from "../PlayerEntity";

import { Game } from "../../Game";

const INTERACTABLE_KNOCKBACK_RATIO = 10;
export abstract class InteractableEntity extends Entity {
	constructor(game: Game, model: EntityModel[] = [], tags: Tag[] = []) {
		super(game, model, ["interactable", ...tags]);
	}

	hit(player: PlayerEntity): Action<Attack> | null {
		// By default, just hit the object back a bit
		return {
			type: "slap-non-player",
			commit: () => {
				this.body.applyImpulse(
					new Vec3(player.lookDir.x, Math.abs(player.lookDir.y) * 0.5 + 0.5, player.lookDir.z).scale(
						INTERACTABLE_KNOCKBACK_RATIO,
					),
				);
				this.game.playSound("defaultHit", this.getPos());
			},
		};
	}

	abstract interact(player: PlayerEntity): Action<Use> | null;
}
