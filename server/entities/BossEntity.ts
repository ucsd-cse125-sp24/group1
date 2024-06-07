import { Vector3 } from "../../common/commontypes";
import { Action, Attack, Use } from "../../common/messages";
import { Game } from "../Game";
import { HeroEntity } from "./HeroEntity";
import { PlayerEntity } from "./PlayerEntity";

const PLAYER_INTERACTION_RANGE = 2.0;
const BOSS_CAPSULE_HEIGHT = 1;
const BOSS_CAPSULE_RADIUS = 0.25;

const BOSS_WALK_SPEED = 18;
/**
 * Maximum change in horizontal velocity that can be caused by the player in one
 * tick
 */
const MAX_BOSS_GROUND_SPEED_CHANGE = 3;
/** Maximum change in horizontal velocity that can occur while in the air */
const MAX_BOSS_AIR_SPEED_CHANGE = 1;
const BOSS_JUMP_SPEED = 8;

export class BossEntity extends PlayerEntity {
	// Game properties
	canPlaceTrap: boolean = true;
	isBoss = true;
	initHealth = 100;

	constructor(game: Game, footPos: Vector3) {
		super(
			game,
			footPos,
			[
				{
					modelId: "mushroom_guy",
					offset: [0, -0.75, 0],
					scale: 0.2,
				},
			],
			10,
			BOSS_CAPSULE_HEIGHT,
			BOSS_CAPSULE_RADIUS,
			BOSS_WALK_SPEED,
			MAX_BOSS_GROUND_SPEED_CHANGE,
			MAX_BOSS_AIR_SPEED_CHANGE,
			BOSS_JUMP_SPEED,
			PLAYER_INTERACTION_RANGE,
		);
	}

	attack(): Action<Attack> | null {
		return super.attack();
	}

	use(): Action<Use> | null {
		const interacted = super.use();
		if (interacted) {
			return interacted;
		}
		const entities = this.game.raycast(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
			{},
			this,
		);
		if (entities[0] instanceof HeroEntity && !entities[0].isSabotaged) {
			return {
				type: "boss:spore",
				commit: () => {
					this.game.sabotageHero(entities[0].id);
				},
			};
		} else if (this.canPlaceTrap) {
			return {
				type: "boss:place-trap",
				commit: () => {
					this.game.placeTrap(this.body.position.vadd(this.lookDir));
					this.canPlaceTrap = false;
					setTimeout(() => {
						this.canPlaceTrap = true;
					}, 5000);
				},
			};
		}
		return null;
	}
}
