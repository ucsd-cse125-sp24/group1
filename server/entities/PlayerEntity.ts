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

const COYOTE_FRAMES = 10;
const WALK_STEP_DIST = 2.5;
const MAX_HEALTH_RING_SIZE = 25;

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

	onGround: boolean;
	jumping = false;
	lookDir: phys.Vec3;
	interactionRange: number;
	itemInHands: null | Item;

	// movement
	walkSpeed: number;
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

		this.#lastSoundPosition = this.body.position.clone();
		this.#lastSoundIsLeft = false;
	}

	move(movement: MovementInfo): void {
		//console.log(this.getPos());

		this.lookDir = new phys.Vec3(...movement.lookDir);

		this.onGround =
			this.game.raycast(
				this.body.position,
				this.body.position.vsub(new phys.Vec3(0, this.#cylinderHeight + this.#capsuleRadius + Entity.EPSILON, 0)),
				{},
				this,
			).length > 0;

		if (this.onGround) this.#coyoteCounter = COYOTE_FRAMES;
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
			const offset = this.lookDir.unit().scale(1.5).vadd(this.lookDir.cross(rightVector).unit().scale(0.5));
			this.itemInHands.body.position = this.body.position.vadd(offset);
			this.itemInHands.body.velocity = new phys.Vec3(0, 0, 0);
			this.itemInHands.body.quaternion = new phys.Quaternion(
				...mat4.getRotation(
					quat.create(),
					mat4.targetTo(mat4.create(), vec3.fromValues(0, 0, 0), this.lookDir.toArray(), vec3.fromValues(0, 1, 0)),
				),
			);
		}

		if (movement.jump && this.#coyoteCounter > 0) {
			if (!this.jumping && this.onGround) {
				this.game.playSound("jump", this.getPos());
				this.game.playParticle({
					spawnCount: 10,
					color: [1, 0, 0, 0.5],
					initialPosition: this.getFootPos(),
					initialVelocityRange: [1, 1, 1],
				});
				this.jumping = true;
			}
			const deltaVy = new phys.Vec3(0, this.jumpSpeed, 0).vsub(currentVelocity.vmul(new phys.Vec3(0, 1, 0)));
			this.body.applyImpulse(deltaVy.scale(this.body.mass));
		} else if (this.jumping) {
			this.jumping = false;
		}
	}

	/**
	 * @returns true if an interaction occurred, false otherwise. Subclasses can
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
		if (entities[0] instanceof InteractableEntity) {
			return entities[0].interact(this);
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
							isGamer ? 6 : 3,
							[{ modelId: "donut" }],
						);
						this.animator.play("punch");
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

		for (const entity of entities) {
			if (entity instanceof PlayerEntity) {
				if (entity instanceof BossEntity) {
					return {
						type: "hit-mini-boss",
						commit: () => {
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
						}
						// Apply knockback to player when attacked
						entity.body.applyImpulse(
							new phys.Vec3(this.lookDir.x * 100, Math.abs(this.lookDir.y) * 50 + 50, this.lookDir.z * 100),
						);
						if (this.itemInHands?.type == "gamer_sword" || this.itemInHands?.type == "sword")
							this.game.playSound("hitBig", entity.getPos());
						else this.game.playSound("hit", entity.getPos());
						this.animator.play("punch");
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
				return 2;
			case "bow":
			case "sword":
				return 1;
		}
		return 0;
	}

	takeDamage(damage: number): void {
		this.health -= damage;
		if (this.health <= 0) {
			this.health = 0;
			// Die
			this.game.addToDeleteQueue(this.id);
		}
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
