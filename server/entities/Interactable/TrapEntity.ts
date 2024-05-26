import * as phys from "cannon-es";
import { ItemMaterial } from "../../materials/SourceMaterials";
import { Game } from "../../Game";
import { Entity, EntityId } from "../Entity";
import { PlayerEntity } from "../PlayerEntity";
import { HeroEntity } from "../HeroEntity";
import { InteractableEntity } from "./InteractableEntity";
import { Item } from "./Item";

export class TrapEntity extends InteractableEntity {
	trappedPlayerId: EntityId | null;
	/** Number of hits left before the trapped player is freed */
	durability: number;

	constructor(game: Game, position: phys.Vec3) {
		super(game, [{ modelId: "defaultCube", scale: 0.25 }]); // TODO: model
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

	hit(player: PlayerEntity): void {
		if (this.trappedPlayerId === null) {
			this.game.addToDeleteQueue(this.id);
			this.game.playSound("trapDisarm", this.getPos());
			return;
		} else if (player.id === this.trappedPlayerId) {
			this.durability -= 1;
			this.game.playSound("trapHit", this.getPos());
		} else {
			this.durability = 0;
		}
		if (this.durability <= 0) {
			this.game.freeHero(this.trappedPlayerId, this.id);
			this.game.playSound("trapEscape", this.getPos());
		}
	}

	interact(player: PlayerEntity): void {}
}
