import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity, Skin } from "../../common/messages";
import { Game } from "../Game";
import { Animator, Animation } from "../lib/Animation";
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

const PLAYER_SCALE: { offset: [number, number, number]; scale: number } = {
	offset: [0, -1.5, 0],
	scale: 0.4,
};

export class HeroEntity extends PlayerEntity {
	// Game properties
	isSabotaged: boolean = false;
	isTrapped: boolean = false;
	isBoss = false;
	initHealth = 3;

	armor: "armor" | "gamer_armor" | undefined;

	animator: Animator;

	constructor(game: Game, color: Skin, footPos: Vector3, model: EntityModel[] = []) {
		super(
			game,
			footPos,
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

		// prettier-ignore
		this.animator = new Animator({
			slap: new Animation([
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}_slap1`}], duration: 3 },
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}_slap2`}], duration: 1 },
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}_slap3`}], duration: 3 },
			], 2),
			walk: new Animation([
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}_walk1`}], duration: 2 },
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}`}], duration: 2 },
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}_walk2`}], duration: 2 },
				{ model: [{...PLAYER_SCALE, modelId: `player_${color}`}], duration: 2 },
			], 1),
		}, model);
	}

	move(movement: MovementInfo): void {
		super.move(movement);
		if (this.onGround && this.body.velocity.length() > this.walkSpeed * 0.5 && !this.isTrapped) {
			this.animator.play("walk");
		}
		if (!this.onGround || this.body.velocity.length() < this.walkSpeed * 0.5) {
			this.animator.cancel("walk");
		}
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

	reset() {
		super.reset();
		this.isSabotaged = false;
		this.isTrapped = false;
	}

	tick(): void {
		this.animator.tick();
		if (this.armor) {
			this.model = [...this.animator.getModel(), { modelId: this.armor, offset: [0, -1.8, 0], scale: 0.5 }];
		} else {
			this.model = this.animator.getModel();
		}
	}

	addArmorModel(type: "armor" | "gamer_armor") {
		this.armor = type;
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			isSabotaged: this.isSabotaged,
			isTrapped: this.isTrapped,
		};
	}
}
