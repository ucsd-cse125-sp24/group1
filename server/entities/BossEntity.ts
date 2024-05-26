import { Vector3 } from "../../common/commontypes";
import { EntityModel } from "../../common/messages";
import { Game } from "../Game";
import { Entity } from "./Entity";
import { HeroEntity } from "./HeroEntity";
import { PlayerEntity } from "./PlayerEntity";

const PLAYER_INTERACTION_RANGE = 2.0;
const BOSS_CAPSULE_HEIGHT = 1;
const BOSS_CAPSULE_RADIUS = 0.25;

const BOSS_WALK_SPEED = 20;
/**
 * Maximum change in horizontal velocity that can be caused by the player in one
 * tick
 */
const MAX_BOSS_GROUND_SPEED_CHANGE = 3;
/** Maximum change in horizontal velocity that can occur while in the air */
const MAX_BOSS_AIR_SPEED_CHANGE = 1;
const BOSS_JUMP_SPEED = 10;

export class BossEntity extends PlayerEntity {
	// Game properties
	jumping: boolean;

	constructor(game: Game, pos: Vector3, model: EntityModel[] = []) {
		super(
			game,
			pos,
			model,
			10,
			BOSS_CAPSULE_HEIGHT,
			BOSS_CAPSULE_RADIUS,
			BOSS_WALK_SPEED,
			MAX_BOSS_GROUND_SPEED_CHANGE,
			MAX_BOSS_AIR_SPEED_CHANGE,
			BOSS_JUMP_SPEED,
			PLAYER_INTERACTION_RANGE,
		);

		this.jumping = false;
	}

	use(): boolean {
		const interacted = super.use();
		if (interacted) {
			return true;
		}
		const entities = this.game.raycast(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
			{ collisionFilterMask: Entity.PLAYER_COLLISION_GROUP, checkCollisionResponse: false },
		);
		if (entities[0] instanceof HeroEntity && !entities[0].isSabotaged) {
			this.game.sabotageHero(entities[0].id);
		}
		return false;
	}
}
