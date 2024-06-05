import { Quaternion, Vec3 } from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { Action, Attack, EntityModel, Use } from "../../common/messages";
import { Game } from "../Game";
import { HeroEntity } from "./HeroEntity";
import { PlayerEntity } from "./PlayerEntity";
import { PhysicsWorld } from "../PhysicsWorld";
import { Entity } from "./Entity";
import { InteractableEntity } from "./Interactable/InteractableEntity";

const PLAYER_INTERACTION_RANGE = 2.0;
const BOSS_CAPSULE_HEIGHT = 4;
const BOSS_CAPSULE_RADIUS = 1;
const BOSS_WALK_SPEED = 5;
/**
 * Maximum change in horizontal velocity that can be caused by the player in one
 * tick
 */
const MAX_BOSS_GROUND_SPEED_CHANGE = 2.5;
/** Maximum change in horizontal velocity that can occur while in the air */
const MAX_BOSS_AIR_SPEED_CHANGE = 1;
const BOSS_JUMP_SPEED = 0;

export class BigBossEntity extends PlayerEntity {
	isBoss = true;
	initHealth = 100;

    previousTick: number;

    isCharge: boolean;

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

        this.isCharge = false;
        this.previousTick = this.game.getCurrentTick();
	}


    attack(): Action<Attack> | null {
        return this.BigBossAttack();
    }

    //TODO: refactor this around the Action<Attack> change!
    BigBossAttack(): Action<Attack> | null {//meleeAttack() {

        console.log(this.game.getCurrentTick(), this.previousTick);
        if (this.game.getCurrentTick() - this.previousTick < 50) {
            return null;
        }

        const lookDir = this.lookDir.unit();

        let quat = new Quaternion(0, 0, 0, 1);
        let base = this.body.position.vadd(lookDir.scale(this.interactionRange))
        let entities: Entity[] = [];


        //hopefully this shoots 5 rays cenetered on Lookdir
        for(let i = 0; i < 5; i++) {
            quat.setFromAxisAngle(new Vec3(0, 1, 0), - 2 * (Math.PI / 36) + (i * (Math.PI / 36)));
            let dir = quat.vmult(base);

            //FOR TESTING
            console.log(dir, i);
            
            entities.push(...this.game.raycast(
                this.body.position,
                dir,
                {},
                this,
            ));
        }
            
        for (const entity of entities) {
            if (entity instanceof HeroEntity) {


                return {
					type: "damage",
					commit: () => {
						console.log("attack", entity.id);

                        if (this.game.getCurrentStage().type === "combat") {
                            entity.takeDamage(1);
                        }
                            // Apply knockback to player when attacked
                        entity.body.applyImpulse(
                            new Vec3(this.lookDir.x * 300, Math.abs(this.lookDir.y) * 150 + 50, this.lookDir.z * 300),
                        );
        
                        this.game.playSound("hit", entity.getPos());
                        this.animator.play("punch");
                        this.previousTick = this.game.getCurrentTick();
					},
				};

            } else if (entities[0] instanceof InteractableEntity) {
				const action = entities[0].hit(this);
				return action
					? {
							...action,
							commit: () => {
								action.commit();
								this.animator.play("punch");
								this.previousTick = this.game.getCurrentTick();
							},
						}
					: null;
			}
        }
        return null;
        
    }


    //TODO: figure out how to refactor this around the Action change
    throwingAttack() {
        if (this.game.getCurrentTick() - this.previousTick < 50) {
            return false;
        }

        //let attackArr = Action<Attack> = [];

        const lookDir = this.lookDir.unit();
        this.animator.play("punch");

        let quat = new Quaternion(0, 0, 0, 1);
        let base = this.body.position.vadd(lookDir.scale(this.interactionRange))
        for(let i = 0; i < 5; i++) {
            quat.setFromAxisAngle(new Vec3(0, 1, 0), - 2 * (Math.PI / 36) + (i * (Math.PI / 36)));
            let dir = quat.vmult(base);

            //FOR TESTING
            console.log(dir);
            
            this.game.shootArrow(
                this.body.position.vadd(lookDir.scale(  2)),
                lookDir.scale(60),
                1,
                [{modelId: "donut"}]
            );
        }
        

        this.previousTick = Date.now();
        return false; 
    }


    //TODO
    charge() {

    }


}
