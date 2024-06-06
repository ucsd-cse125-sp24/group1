import { Box, Quaternion, Vec3 } from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { Action, Attack, EntityModel, Use } from "../../common/messages";
import { Game } from "../Game";
import { HeroEntity } from "./HeroEntity";
import { PlayerEntity } from "./PlayerEntity";
import { PhysicsWorld } from "../PhysicsWorld";
import { Entity } from "./Entity";
import { InteractableEntity } from "./Interactable/InteractableEntity";

const PLAYER_INTERACTION_RANGE = 7.0;
const BOSS_CAPSULE_HEIGHT = 4;
const BOSS_CAPSULE_RADIUS = 1;
const BOSS_WALK_SPEED = 8;
/**
 * Maximum change in horizontal velocity that can be caused by the player in one
 * tick
 */
const MAX_BOSS_GROUND_SPEED_CHANGE = 2.5;
/** Maximum change in horizontal velocity that can occur while in the air */
const MAX_BOSS_AIR_SPEED_CHANGE = 1;
const BOSS_JUMP_SPEED = 0;

const BOSS_ATTACK_COOLDOWN = 50; // ticks

export class BigBossEntity extends PlayerEntity {
	isBoss = true;
	initHealth = 100;

    previousAttackTick: number;
    chargeTicks: number;

	constructor(game: Game, pos: Vector3, model: EntityModel[] = []) {
		super(
			game,
			pos,
			[
				{
					modelId: "mushroom_king",
					offset: [0, -0.75, 0],
					scale: 1,
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

        this.previousAttackTick = this.game.getCurrentTick();
        this.chargeTicks = 0;
	}

    attack(): Action<Attack> | null {
        if (this.game.getCurrentTick() - this.previousAttackTick < BOSS_ATTACK_COOLDOWN) {
            return null;
        }

        this.previousAttackTick = this.game.getCurrentTick();
        return {
            type: "damage",
            commit: () => {
                const lookDir = this.lookDir.unit();
                const rightDir = lookDir.cross(new Vec3(0, 1, 0)).unit();

                let quat = new Quaternion(0, 0, 0, 1);
                let base = this.body.position.vadd(lookDir.scale(this.interactionRange))
                let entities: Entity[] = [];

                //hopefully this shoots 5 rays centered on Lookdir
                for(let i = 0; i < 5; i++) {
                    quat.setFromAxisAngle(new Vec3(0, 1, 0), - 2 * (Math.PI / 36) + (i * (Math.PI / 36)));
                    let dir = quat.vmult(lookDir.scale(this.interactionRange));

                    let betterDirection = this.body.position.vadd(dir);

                    //FOR TESTING
                    //console.log(betterDirection, i);
                    
                    entities.push(...this.game.raycast(
                        this.body.position,
                        dir,
                        {},
                        this,
                    ));
                }
                    
                for (const entity of entities) {
                    if (entity instanceof HeroEntity) {
                        if (this.game.getCurrentStage().type === "combat") {
                            entity.takeDamage(1);
                        }
                        // Apply knockback to player when attacked
                        entity.body.applyImpulse(
                            new Vec3(this.lookDir.x * 300, Math.abs(this.lookDir.y) * 150 + 50, this.lookDir.z * 300),
                        );
                        this.game.playSound("hit", entity.getPos());
                        this.animator.play("punch");
                    } else if (entities[0] instanceof InteractableEntity) {
                        entities[0].hit(this);
                        this.animator.play("punch");
                    }
                }
            }
        }
    }

    use(): Action<Use> | null {
        if (this.game.getCurrentTick() - this.previousAttackTick < BOSS_ATTACK_COOLDOWN) {
            return null;
        }
        this.previousAttackTick = this.game.getCurrentTick();

        return {
            type: "bigboss:shoot-shroom",
            commit: () => {
                const lookDir = this.lookDir.unit();

                let quat = new Quaternion(0, 0, 0, 1);
                let base = this.body.position.vadd(lookDir.scale(this.interactionRange));

                for(let i = 0; i < 5; i++) {
                    quat.setFromAxisAngle(new Vec3(0, 1, 0), - 2 * (Math.PI / 36) + (i * (Math.PI / 36)));
                    let dir = quat.vmult(lookDir.scale(this.interactionRange - 2));
                    let betterDirection = this.body.position.vadd(dir);
                    
                    this.game.shootArrow(
                        this.body.position.vadd(betterDirection),
                        dir.scale(60),
                        1,
                        [{modelId: "donut"}]
                    );
                }
                this.animator.play("punch");
            }
        }
    }

    //TODO
    charge() {

    }
}
