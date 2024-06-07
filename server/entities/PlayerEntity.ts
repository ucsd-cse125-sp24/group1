import * as phys from "cannon-es";
import { mat4, quat, vec3 } from "gl-matrix";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { Action, Attack, EntityModel, SerializedEntity, Use } from "../../common/messages";
import { Animation, Animator } from "../lib/Animation";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";
import { InteractableEntity } from "./Interactable/InteractableEntity";
import { BossEntity } from "./BossEntity";

const COYOTE_FRAMES = 4;
const UPWARD_FRAMES = 9;
const WALK_STEP_DIST = 2.4;
const MAX_HEALTH_RING_SIZE = 25;
const BOOST_RATIO = 11.2;
const KNOCKBACK_RATIO = 1.5;
const KNOCKBACK_RATIO_SWORD = 3;
const KNOCKBACK_RATIO_GAMER_SWORD = 10;

export abstract class PlayerEntity extends Entity {
	isPlayer = true;
	/** NOTE: Prefer using `player instanceof BossEntity` or `HeroEntity` */
	isBoss: boolean = false;
	initHealth: number = 0;
	health: number = 0;
	/** Timestamp of previous attack in milliseconds */
	#previousAttackTime: number = 0;
	/** Minimum time between attacks in milliseconds */
	attackCooldown: number = 500;
	displayName = `Player ${this.id}`;
	isInvulnerableThisTick = false;

	onGround: boolean;
	jumping = false;
	lookDir: phys.Vec3;
	interactionRange: number;
	itemInHands: null | Item;

	// movement
	walkSpeed: number;
	initialSpeed: number;
	jumpSpeed: number;
	#maxGroundSpeedChange: number;
	#maxAirSpeedChange: number;

	// shapes (the top sphere is the center of the entity)
	#cylinderHeight: number;
	#capsuleRadius: number;
	#cylinder: phys.Cylinder;
	#sphereTop: phys.Sphere;
	#sphereBot: phys.Sphere;
	/** The Y offset of the top of the entity. */
	headOffset: number;
	/** The Y offset (should be negative) of the bottom of the entity. */
	footOffset: number;

	// coyote countdown
	#coyoteCounter: number;
	#upwardCounter: number;

	// walking sound
	#lastSoundPosition: phys.Vec3;
	#lastSoundIsLeft: boolean;

	// animator
	animator: Animator;

	constructor(
		game: Game,
		footPos: Vector3,
		model: EntityModel[] = [],
		mass: number,
		capsuleHeight: number,
		capsuleRadius: number,
		walkSpeed: number,
		maxGroundSpeedChange: number,
		maxAirSpeedChange: number,
		jumpSpeed: number,
		interactionRange: number,
	) {
		super(game, model, ["player"]);

		this.itemInHands = null;
		this.interactionRange = interactionRange;
		this.lookDir = new phys.Vec3(0, -1, 0);

		this.walkSpeed = walkSpeed;
		this.initialSpeed = walkSpeed;
		this.jumpSpeed = jumpSpeed;
		this.onGround = false;
		this.#capsuleRadius = capsuleRadius;
		this.#cylinderHeight = capsuleHeight - 2 * capsuleRadius;
		this.headOffset = this.#capsuleRadius;
		this.footOffset = -this.#cylinderHeight - this.#capsuleRadius;
		this.#maxGroundSpeedChange = maxGroundSpeedChange;
		this.#maxAirSpeedChange = maxAirSpeedChange;

		const pos = [footPos[0], footPos[1] - this.footOffset, footPos[2]];

		this.body = new phys.Body({
			mass: mass,
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: PlayerMaterial,
			collisionFilterGroup: this.getBitFlag(),
		});

		// prettier-ignore
		this.animator = new Animator({
			punch: new Animation([
				{ model: ["chair"], duration: 5 },
				{ model: ["donut"], duration: 5 },
				{ model: ["fish1"], duration: 5 },
			]),
			jump: new Animation([
				{ model: ["chair"], duration: 5 },
				{ model: ["donut"], duration: 5 },
				{ model: ["fish1"], duration: 5 },
			]),
		}, model);

		this.#cylinder = new phys.Cylinder(this.#capsuleRadius, this.#capsuleRadius, this.#cylinderHeight, 12);
		this.#sphereTop = new phys.Sphere(this.#capsuleRadius);
		this.#sphereBot = new phys.Sphere(this.#capsuleRadius);

		this.body.addShape(this.#cylinder, new phys.Vec3(0, -this.#cylinderHeight / 2, 0));
		this.body.addShape(this.#sphereTop);
		this.body.addShape(this.#sphereBot, new phys.Vec3(0, -this.#cylinderHeight, 0));

		this.#coyoteCounter = 0;
		this.#upwardCounter = 0;

		this.#lastSoundPosition = this.body.position.clone();
		this.#lastSoundIsLeft = false;
	}

	checkOnGround(): boolean {
		const posFront = this.body.position.vadd(new phys.Vec3(this.#capsuleRadius * 0.6, 0, 0));
		const posBack = this.body.position.vadd(new phys.Vec3(-this.#capsuleRadius * 0.6, 0, 0));
		const posLeft = this.body.position.vadd(new phys.Vec3(0, 0, this.#capsuleRadius * 0.6));
		const posRight = this.body.position.vadd(new phys.Vec3(0, 0, -this.#capsuleRadius * 0.6));
		const offset = new phys.Vec3(0, this.#cylinderHeight + this.#capsuleRadius + Entity.EPSILON, 0);

		return (
			this.game.raycast(this.body.position, this.body.position.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posFront, posFront.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posBack, posBack.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posLeft, posLeft.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posRight, posRight.vsub(offset), {}, this).length > 0
		);
	}

	move(movement: MovementInfo): void {
		//console.log(this.getPos());

		this.lookDir = new phys.Vec3(...movement.lookDir);

		this.onGround = this.checkOnGround();

		if (this.#upwardCounter > 0) this.#coyoteCounter = 0;
		else if (this.onGround) this.#coyoteCounter = COYOTE_FRAMES;
		else if (this.#coyoteCounter > 0) this.#coyoteCounter -= 1;

		const forwardVector = new phys.Vec3(movement.lookDir[0], 0, movement.lookDir[2]);
		forwardVector.normalize();
		const rightVector = forwardVector.cross(new phys.Vec3(0, 1, 0));
		const currentVelocity = this.body.velocity;
		const maxChange = this.onGround ? this.#maxGroundSpeedChange : this.#maxAirSpeedChange;

		let targetVelocity = new phys.Vec3(0, 0, 0);
		if (movement.forward) {
			targetVelocity = targetVelocity.vadd(forwardVector);
		}
		if (movement.backward) {
			targetVelocity = targetVelocity.vadd(forwardVector.negate());
		}
		if (movement.right) {
			targetVelocity = targetVelocity.vadd(rightVector);
		}
		if (movement.left) {
			targetVelocity = targetVelocity.vadd(rightVector.negate());
		}
		if (targetVelocity.length() > 0) {
			targetVelocity.normalize();
		}
		targetVelocity = targetVelocity.scale(this.walkSpeed);

		let deltaVelocity = targetVelocity.vsub(currentVelocity.vmul(new phys.Vec3(1, 0, 1)));
		if (deltaVelocity.length() > maxChange) {
			deltaVelocity = deltaVelocity.scale(maxChange / deltaVelocity.length());
		}
		this.body.applyImpulse(deltaVelocity.scale(this.body.mass));

		if (this.itemInHands instanceof Item) {
			let offset = this.lookDir
				.unit()
				.scale(1.5)
				.vadd(this.lookDir.cross(rightVector).unit().scale(0.5))
				.vadd(rightVector.unit().scale(0.75));

			this.itemInHands.body.position = this.body.position.vadd(offset);
			this.itemInHands.body.velocity = new phys.Vec3(0, 0, 0);

			this.itemInHands.body.quaternion = new phys.Quaternion(
				...mat4.getRotation(
					quat.create(),
					mat4.targetTo(mat4.create(), vec3.fromValues(0, 0, 0), this.lookDir.toArray(), vec3.fromValues(0, 1, 0)),
				),
			);
		}

		if (movement.jump) {
			if (!this.jumping && this.#coyoteCounter > 0) {
				this.game.playSound("jump", this.getPos());
				this.game.playParticle({
					spawnCount: 10,
					color: [234, 221, 202, 0.5],
					initialPosition: this.getFootPos(),
					initialVelocityRange: [1, 1, 1],
				});
				this.jumping = true;
				const boost = currentVelocity.clone();
				if (boost.length() > 0) boost.normalize();
				this.body.applyImpulse(boost.scale(this.body.mass).scale(BOOST_RATIO + (movement.backward ? 1 : 0))); // rewards backward bhop because funny
				this.#upwardCounter = UPWARD_FRAMES;
			}
			if (this.#upwardCounter > 0) {
				const deltaVy = new phys.Vec3(0, this.jumpSpeed, 0).vsub(currentVelocity.vmul(new phys.Vec3(0, 1, 0)));
				this.body.applyImpulse(deltaVy.scale(this.body.mass));
				this.#upwardCounter -= 1;
			} else {
				this.jumping = false;
			}
		} else if (this.jumping) {
			this.jumping = false;
			this.#upwardCounter = 0;
		}
	}

	/**
	 * @returns Action<Use> if an interaction occurred, null otherwise. Subclasses can
	 * call this (`super.use()`) and use the return value to determine whether to
	 * perform subclass-unique actions.
	 */
	use(): Action<Use> | null {
		if (this.itemInHands) {
			return this.itemInHands.interact(this);
		}
		const entities = this.game.raycast(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
			{},
			this,
		);
		if (entities[0]?.entity instanceof InteractableEntity) {
			if (
				entities[0].entity instanceof Item &&
				(entities[0].entity.type == "armor" || entities[0].entity.type == "gamer_armor")
			) {
				return this.game.playerEquipArmor(entities[0].entity, this);
			}
			return entities[0].entity.interact(this);
		}
		return null;
	}

	attack(): Action<Attack> | null {
		if (Date.now() - this.#previousAttackTime < this.attackCooldown) {
			// TODO: should this cooldown be shown to the client? if it's shown, it
			// might annoy the player more than if the cooldown were unnoticeable
			return null;
		}
		const lookDir = this.lookDir.unit();
		// This is for firing the bow
		if (!this.isBoss && this.itemInHands !== null) {
			if (this.itemInHands.type === "bow" || this.itemInHands.type === "gamer_bow") {
				const isGamer = this.itemInHands.type === "gamer_bow";

				return {
					type: "hero:shoot-arrow",
					commit: () => {
						this.game.shootArrow(
							this.body.position.vadd(lookDir.scale(2)),
							lookDir.scale(isGamer ? 80 : 40),
							isGamer ? 4 : 2,
							[{ modelId: "donut" }],
						);
						//this.animator.play("punch");
						this.#previousAttackTime = Date.now();
					},
				};
			}
		}
		const entities = this.game.raycast(
			this.body.position,
			this.body.position.vadd(lookDir.scale(this.interactionRange)),
			{},
			this,
		);

		for (const { entity, point } of entities) {
			if (entity instanceof PlayerEntity) {
				if (entity instanceof BossEntity) {
					return {
						type: "hit-mini-boss",
						commit: () => {
							this.game.playParticle({
								spawnCount: 50,
								initialPosition: this.getPos(),
								initialVelocity: [0, 5, 0],
								initialVelocityRange: [4, 0, 4],
								color: [255, 140, 0, 0.5] 
							});

							this.game.playerHitBoss(entity);
							this.game.playDamageFilter(entity.id);
						},
					};
				}
				const currentStage = this.game.getCurrentStage().type;
				let damage = 0;
				if (currentStage === "combat") {
					if (this.isBoss) {
						// Boss doesn't need weapons
						damage = 1;
					} else if (entity.isBoss) {
						damage = entity.getWeaponDamage(this.itemInHands);
					}
					if (damage === 0) {
						continue;
					}
				}
				return {
					type: currentStage === "combat" ? "combat:damage" : "crafting-stage:slap-player",
					commit: () => {
						console.log("attack", entity.id);
						if (damage > 0) {
							entity.takeDamage(damage);
							this.game.playDamageFilter(entity.id);
							// Only have a cooldown for damage-dealing attacks
							this.#previousAttackTime = Date.now();

							this.game.playParticle({
								spawnCount: 10,
								size: 20,
								color: [1, 0, 0, 1],
								initialPosition: point.toArray(),
								initialVelocity: [0, 1, 0],
								initialVelocityRange: [1, 1, 1],
								ttl: 1,
							});
						} else {
							this.game.playParticle({
								spawnCount: 10,
								size: 10,
								initialPosition: point.toArray(),
								initialVelocity: [0, 1, 0],
								initialVelocityRange: [1, 1, 1],
								ttl: 1,
							});
						}

						const knockback =
							this.itemInHands?.type == "gamer_sword"
								? KNOCKBACK_RATIO_GAMER_SWORD
								: this.itemInHands?.type == "sword"
									? KNOCKBACK_RATIO_SWORD
									: KNOCKBACK_RATIO;

						// Apply knockback to player when attacked
						entity.body.applyImpulse(
							new phys.Vec3(this.lookDir.x * 100, Math.abs(this.lookDir.y) * 50 + 50, this.lookDir.z * 100).scale(
								knockback,
							),
						);
						if (this.itemInHands?.type == "gamer_sword" || this.itemInHands?.type == "sword")
							this.game.playSound("hitBig", entity.getPos());
						else this.game.playSound("hit", entity.getPos());
						//this.animator.play("punch");
					},
				};
			} else if (entity instanceof InteractableEntity) {
				const action = entity.hit(this);
				return action
					? {
							...action,
							commit: () => {
								action.commit();
								//this.animator.play("punch");
								this.game.playParticle({
									spawnCount: 10,
									size: 10,
									initialPosition: point.toArray(),
									initialVelocity: [0, 1, 0],
									initialVelocityRange: [1, 1, 1],
								});
								// Allow spam-slapping items
								// this.#previousAttackTime = Date.now();
							},
						}
					: null;
			}
		}
		return null;
	}

	getWeaponDamage(weapon: Item | null): number {
		if (weapon === null) {
			return 0;
		}
		switch (weapon.type) {
			case "gamer_bow":
			case "gamer_sword":
				return 6;
			case "bow":
			case "sword":
				return 3;
		}
		return 0;
	}

	takeDamage(damage: number): void {
		if (this.isInvulnerableThisTick) {
			return;
		}
		this.health -= damage;
		if (this.health <= 0) {
			this.health = 0;
			// Die
			this.game.addToDeleteQueue(this.id);
		}
		this.isInvulnerableThisTick = true;
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			position: this.body.position.toArray(),
			quaternion: quat.rotationTo(
				quat.create(),
				vec3.fromValues(-1, 0, 0),
				this.lookDir
					.vmul(new phys.Vec3(1, 0, 1))
					.unit()
					.toArray(),
			),
			model: [
				...this.model,
				{
					text: this.displayName,
					height: 0.3,
					offset: [0, this.headOffset + 0.6, 0],
					rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
					font: { weight: "bold" },
				},
				...Array.from(
					{ length: this.game.getCurrentStage().type === "combat" ? this.health : 0 },
					(_, i): EntityModel => {
						const ring = Math.floor(i / MAX_HEALTH_RING_SIZE);
						const angle = (i % MAX_HEALTH_RING_SIZE) / Math.min(this.health, MAX_HEALTH_RING_SIZE);
						const radius = 0.08 * (Math.min(this.health, MAX_HEALTH_RING_SIZE) - 1);
						const revolutionSpeed = Math.sin(ring * 0.9) * 0.2 + 1;
						return {
							modelId: "healthCrystal",
							scale: 0.1,
							offset: [
								Math.cos((angle + (Date.now() / radius) * 0.00005 * revolutionSpeed) * 2 * Math.PI) * radius,
								this.headOffset + 0.3 + Math.cos((angle + Date.now() / 20000) * 10 * Math.PI) * 0.05 + ring * 0.4,
								Math.sin((angle + (Date.now() / radius) * 0.00005 * revolutionSpeed) * 2 * Math.PI) * radius,
							],
						};
					},
				),
			],
			health: this.health,
		};
	}

	tick() {
		this.animator.tick();
		this.model = this.animator.getModel();
	}

	setSpeed(speed: number) {
		this.walkSpeed = speed;
	}

	resetSpeed() {
		this.walkSpeed = this.initialSpeed;
	}

	/** returns 0 if don't, 1 if left, 2 if right */
	shouldPlayWalkingSound() {
		if (!this.onGround) return 0;
		if (this.body.position.distanceTo(this.#lastSoundPosition) > WALK_STEP_DIST) {
			this.#lastSoundPosition = this.body.position.clone();
			this.#lastSoundIsLeft = !this.#lastSoundIsLeft;
			return this.#lastSoundIsLeft ? 1 : 2;
		}
		return 0;
	}

	reset() {
		this.health = this.initHealth;
	}

	/**
	 * Since `getPos` gets the position at the camera, this gets the position of
	 * the player's foot.
	 */
	getFootPos(): Vector3 {
		const [x, y, z] = this.getPos();
		return [x, y + this.footOffset, z];
	}
}
