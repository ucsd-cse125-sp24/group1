import { Vector3 } from "../../common/commontypes";
import { EntityModel } from "../../common/messages";
import { Game } from "../Game";
import { PlayerEntity } from "./PlayerEntity";

const PLAYER_INTERACTION_RANGE = 15.0; // TEMP, but 2 is too low IMO
const HERO_CAPSULE_HEIGHT = 2;
const HERO_CAPSULE_RADIUS = 0.5;

const HERO_WALK_SPEED = 20;
/**
 * Maximum change in horizontal velocity that can be caused by the player in one
 * tick
 */
const MAX_HERO_GROUND_SPEED_CHANGE = 3;
/** Maximum change in horizontal velocity that can occur while in the air */
const MAX_HERO_AIR_SPEED_CHANGE = 1;
const HERO_JUMP_SPEED = 10;

export class HeroEntity extends PlayerEntity {
	// Game properties
	jumping: boolean;

	constructor(game: Game, pos: Vector3, model: EntityModel[] = []) {
		super(
			game,
			pos,
			model,
			10,
			HERO_CAPSULE_HEIGHT,
			HERO_CAPSULE_RADIUS,
			HERO_WALK_SPEED,
			MAX_HERO_GROUND_SPEED_CHANGE,
			MAX_HERO_AIR_SPEED_CHANGE,
			HERO_JUMP_SPEED,
			PLAYER_INTERACTION_RANGE,
		);

		this.type = "player-hero";
		this.jumping = false;
	}
}
