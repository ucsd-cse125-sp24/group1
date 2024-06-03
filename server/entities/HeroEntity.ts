import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { Game } from "../Game";
import { PlayerEntity } from "./PlayerEntity";

const PLAYER_INTERACTION_RANGE = 8.0; // TEMP, but 2 is too low IMO
const HERO_CAPSULE_HEIGHT = 2;
const HERO_CAPSULE_RADIUS = 0.5;

const HERO_WALK_SPEED = 16;
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
	isSabotaged: boolean = false;
	isTrapped: boolean = false;
	isBoss = false;
	health = 3;

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
	}

	move(movement: MovementInfo): void {
		super.move(movement);
		if (this.isTrapped) {
			this.body.applyImpulse(this.body.velocity.scale(-this.body.mass));
		}
	}

	sabotage(): void {
		this.isSabotaged = true;
		this.setSpeed(HERO_WALK_SPEED / 2);
		// TODO: Maybe use some tick counter instead of setTimeout
		setTimeout(() => {
			this.isSabotaged = false;
			this.setSpeed(HERO_WALK_SPEED);
		}, 5000);
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			isSabotaged: this.isSabotaged,
			isTrapped: this.isTrapped,
		};
	}
}
