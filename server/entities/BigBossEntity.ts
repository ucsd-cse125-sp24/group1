import { Quaternion, Vec3 } from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { Action, Attack, Use } from "../../common/messages";
import { Game } from "../Game";
import { HeroEntity } from "./HeroEntity";
import { PlayerEntity } from "./PlayerEntity";
import { Entity } from "./Entity";
import { InteractableEntity } from "./Interactable/InteractableEntity";
import { MinecartEntity } from "./MinecartEntity";
import { log } from "../net/_tempDebugLog";
import { Animator, Animation } from "../lib/Animation";

const PLAYER_INTERACTION_RANGE = 12;
const BOSS_CAPSULE_HEIGHT = 7.5;
const BOSS_CAPSULE_RADIUS = 1.5;
const BOSS_WALK_SPEED = 10;
/**
 * Maximum change in horizontal velocity that can be caused by the player in one
 * tick
 */
const MAX_BOSS_GROUND_SPEED_CHANGE = 2.5;
/** Maximum change in horizontal velocity that can occur while in the air */
const MAX_BOSS_AIR_SPEED_CHANGE = 1;
const BOSS_JUMP_SPEED = 10;

const BOSS_ATTACK_COOLDOWN = 50; // ticks

const BIG_BOSS_SCALE: { offset: [number, number, number]; rotation: [number, number, number, number] } = {
	offset: [0, 0, 0] as Vector3,
	rotation: new Quaternion(0, 0, 0, 1).setFromAxisAngle(new Vec3(0, 1, 0), Math.PI).toArray(),
} as const;

export class BigBossEntity extends PlayerEntity {
	isBoss = true;
	initHealth = 60;

	previousAttackTick: number;
	previousShootTick: number;

	chargeTicks: number;

	animator: Animator;

	constructor(game: Game, footPos: Vector3) {
		const model = {
			modelId: "mushroom_king" as const,
			...BIG_BOSS_SCALE,
		};
		super(
			game,
			footPos,
			[model],
			8,
			BOSS_CAPSULE_HEIGHT,
			BOSS_CAPSULE_RADIUS,
			BOSS_WALK_SPEED,
			MAX_BOSS_GROUND_SPEED_CHANGE,
			MAX_BOSS_AIR_SPEED_CHANGE,
			BOSS_JUMP_SPEED,
			PLAYER_INTERACTION_RANGE,
		);
		model.offset[1] = this.footOffset;

		this.animator = new Animator(
			{
				hit: new Animation(
					[
						{ model: [{ ...BIG_BOSS_SCALE, modelId: `big_boss_hit1` }], duration: 3 },
						{ model: [{ ...BIG_BOSS_SCALE, modelId: `big_boss_hit2` }], duration: 3 },
					],
					2,
				),
			},
			[model],
		);

		this.previousAttackTick = this.game.getCurrentTick();
		this.previousShootTick = this.game.getCurrentTick();

		this.chargeTicks = 0;
	}

	handleLanding(fallHeight: number): void {
		super.handleLanding(fallHeight);
		this.game.shakeFromSource(this.getFootPos(), fallHeight / 20, 10, this);
	}

	attack(): Action<Attack> | null {
		if (this.game.getCurrentTick() - this.previousAttackTick < BOSS_ATTACK_COOLDOWN) {
			return super.attack();
		}
		if (this.game.getCurrentTick() - this.previousAttackTick > BOSS_ATTACK_COOLDOWN) {
			this.animator.play("hit");
		}

		return {
			type: "combat:damage",
			commit: () => {
				const lookDir = this.lookDir.unit();
				const rightDir = lookDir.cross(new Vec3(0, 1, 0)).unit();

				let quat = new Quaternion(0, 0, 0, 1);
				let base = this.body.position.vadd(lookDir.scale(this.interactionRange));
				let entities: Entity[] = [];

				//hopefully this shoots 5 rays centered on Lookdir
				for (let i = 0; i < 5; i++) {
					quat.setFromAxisAngle(new Vec3(0, 1, 0), -2 * (Math.PI / 30) + i * (Math.PI / 30));
					let dir = quat.vmult(lookDir.scale(this.interactionRange));

					let betterDirection = this.body.position.vadd(dir);

					//FOR TESTING
					//console.log(betterDirection, i);

					entities.push(
						...this.game.raycast(this.body.position, betterDirection, {}, this).map(({ entity }) => entity),
					);
				}

				for (const entity of entities) {
					if (entity instanceof HeroEntity || entity instanceof MinecartEntity) {
						if (this.game.getCurrentStage().type === "combat") {
							entity.takeDamage(1);
							log("Minecart taking damage");
						}
						// Apply knockback to player when attacked
						entity.body.applyImpulse(
							new Vec3(this.lookDir.x * 300, Math.abs(this.lookDir.y) * 150 + 50, this.lookDir.z * 300),
						);
						this.game.playSound("bossMelee", entity.getPos());
					} else if (entity instanceof InteractableEntity) {
						entity.hit(this);
					}
				}
				this.previousAttackTick = this.game.getCurrentTick();
			},
		};
	}

	use(): Action<Use> | null {
		if (this.game.getCurrentTick() - this.previousShootTick < BOSS_ATTACK_COOLDOWN) {
			return null;
		}

		//console.log(this.game.getCurrentTick() - this.previousShootTick, this.previousShootTick);

		return {
			type: "bigboss:shoot-shroom",
			commit: () => {
				const lookDir = this.lookDir.unit();

				let quat = new Quaternion(0, 0, 0, 1);
				let base = this.body.position.vadd(lookDir.scale(this.interactionRange));
				for (let i = 0; i < 3; i++) {
					quat.setFromAxisAngle(new Vec3(0, 1, 0), -1 * (Math.PI / 30) + i * (Math.PI / 30));
					let dir = quat.vmult(lookDir.scale(6));
					let betterDirection = this.body.position.vadd(dir);

					this.game.shootArrow(betterDirection, dir.scale(10), 1, [{ modelId: "mushroom" }]);
					this.game.playSound("bossRange", this.getPos());
					//console.log(dir, betterDirection, betterDirection.unit(), this.body.position.vadd(betterDirection.unit()), this.getPos());
				}
				//this.animator.play("pee");
				this.previousShootTick = this.game.getCurrentTick();
			},
		};
	}

	tick() {
		this.animator.tick();
		this.model = this.animator.getModel();
	}

	//TODO
	charge() {}
}
