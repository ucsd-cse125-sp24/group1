import { Vector3 } from "../../common/commontypes";
import { EntityModel } from "../../common/messages";
import { PlayerEntity } from "./PlayerEntity";

const PLAYER_INTERACTION_RANGE = 2.0;
const BOSS_CAPSULE_HEIGHT = 2;
const BOSS_CAPSULE_RADIUS = 0.5;

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

	constructor(name: string, pos: Vector3, model: EntityModel[] = []) {
		super(
			name,
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

		this.type = "player-boss";
		this.jumping = false;
	}

}
