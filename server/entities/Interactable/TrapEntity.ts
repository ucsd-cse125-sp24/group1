import * as phys from "cannon-es";
import { ItemMaterial } from "../../materials/SourceMaterials";
import { Game } from "../../Game";
import { Entity, EntityId } from "../Entity";
import { PlayerEntity } from "../PlayerEntity";
import { HeroEntity } from "../HeroEntity";
import { InteractableEntity } from "./InteractableEntity";
import { Action, Attack, Use } from "../../../common/messages";

export class TrapEntity extends InteractableEntity {
	trappedPlayerId: EntityId | null;
	/** Number of hits left before the trapped player is freed */
	durability: number;

	constructor(game: Game, position: phys.Vec3) {
		super(game, [{ modelId: "trap", scale: 0.25, offset: [0, -.2, 0] }]); 
		this.body = new phys.Body({
			mass: 100,
			position,
			material: ItemMaterial,
			collisionFilterGroup: this.getBitFlag(),
			shape: new phys.Box(new phys.Vec3(0.25, 0.25, 0.25)),
		});
		this.trappedPlayerId = null;
		this.durability = 10;
	}

	onCollide(otherEntity: Entity): void {
		if (this.trappedPlayerId === null && otherEntity instanceof HeroEntity) {
			this.trappedPlayerId = otherEntity.id;
			this.game.trapHero(otherEntity.id, this.body.position.vadd(new phys.Vec3(0, 2, 0)));
		}
	}

	hit(player: PlayerEntity): Action<Attack> | null {
		const trappedPlayerId = this.trappedPlayerId;
		if (trappedPlayerId === null) {
			return {
				type: "disarm-trap",
				commit: () => {
					this.game.addToDeleteQueue(this.id);
					this.game.playSound("trapDisarm", this.getPos());
				},
			};
		} else {
			return {
				type: "damage-trap",
				commit: () => {
					if (player.id === trappedPlayerId) {
						this.durability -= 1;
					} else {
						this.durability = 0;
					}
					// We could move this to the else branch if we want the sounds to be
					// exclusive
					this.game.playSound("trapHit", this.getPos());
					if (this.durability <= 0) {
						this.game.freeHero(trappedPlayerId, this.id);
						this.game.playSound("trapEscape", this.getPos());
					}
				},
			};
		}
	}

	interact(player: PlayerEntity): Action<Use> | null {
		return null;
	}
}
