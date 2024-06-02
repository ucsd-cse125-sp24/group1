import * as phys from "cannon-es";
import { quat, vec3 } from "gl-matrix";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";
import { InteractableEntity } from "./Interactable/InteractableEntity";

const COYOTE_FRAMES = 10;

export abstract class PlayerEntity extends Entity {
	isPlayer = true;
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

	// shapes
	#eyeHeight: number;
	#cylinderHeight: number;
	#capsuleRadius: number;
	#cylinder: phys.Cylinder;
	#sphereTop: phys.Sphere;
	#sphereBot: phys.Sphere;

	// coyote countdown
	#coyoteCounter: number;

	constructor(
		game: Game,
		pos: Vector3,
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

		this.isPlayer = true;

		this.itemInHands = null;
		this.interactionRange = interactionRange;
		this.lookDir = new phys.Vec3(0, -1, 0);

		this.walkSpeed = walkSpeed;
		this.jumpSpeed = jumpSpeed;
		this.onGround = false;
		this.#capsuleRadius = capsuleRadius;
		this.#cylinderHeight = capsuleHeight - 2 * capsuleRadius;
		this.#eyeHeight = capsuleHeight - capsuleRadius;
		this.#maxGroundSpeedChange = maxGroundSpeedChange;
		this.#maxAirSpeedChange = maxAirSpeedChange;

		this.body = new phys.Body({
			mass: mass,
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: PlayerMaterial,
			collisionFilterGroup: this.getBitFlag(),
		});

		this.#cylinder = new phys.Cylinder(this.#capsuleRadius, this.#capsuleRadius, this.#cylinderHeight, 12);
		this.#sphereTop = new phys.Sphere(this.#capsuleRadius);
		this.#sphereBot = new phys.Sphere(this.#capsuleRadius);

		this.body.addShape(this.#cylinder, new phys.Vec3(0, -this.#cylinderHeight / 2, 0));
		this.body.addShape(this.#sphereTop);
		this.body.addShape(this.#sphereBot, new phys.Vec3(0, -this.#cylinderHeight, 0));

		this.#coyoteCounter = 0;
	}

	move(movement: MovementInfo): void {
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
			//this is a little janky ngl
			this.itemInHands.body.position = this.body.position.vadd(
				new phys.Vec3(this.lookDir.x, -0.25, this.lookDir.z)
					.unit()
					.scale(this.#capsuleRadius + this.itemInHands.radius),
			);
			this.itemInHands.body.velocity = new phys.Vec3(0, 0, 0);
			this.itemInHands.body.quaternion = new phys.Quaternion(0, 0, 0, 1).setFromEuler(1.5707, 0, 0);
		}

		if (movement.jump && this.#coyoteCounter > 0) {
			if (!this.jumping && this.onGround) {
				this.game.playSound("jump", this.getPos());
				this.game.playParticle(this.getPos());
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
	use(): boolean {
		if (this.itemInHands) {
			this.itemInHands.interact(this);
			return true;
		}
		const entities = this.game.raycast(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
			{},
			this,
		);
		if (entities[0] instanceof InteractableEntity) {
			entities[0].interact(this);
			return true;
		}
		return false;
	}

	attack(): boolean {
		const entities = this.game.raycast(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
			{},
			this,
		);
		for (const entity of entities) {
			// Apply knockback to player when attacked
			if (entity instanceof PlayerEntity) {
				console.log("attack", entity.id);
				entity.body.applyImpulse(
					new phys.Vec3(this.lookDir.x * 100, Math.abs(this.lookDir.y) * 50 + 50, this.lookDir.z * 100),
				);
				this.game.playSound("hit", entity.getPos());
				return true;
			} else if (entities[0] instanceof InteractableEntity) {
				entities[0].hit(this);
				return true;
			}
		}
		return false;
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			position: this.body.position.toArray(),
			quaternion: quat.rotationTo(
				quat.create(),
				vec3.fromValues(1, 0, 0),
				this.lookDir
					.vmul(new phys.Vec3(1, 0, 1))
					.unit()
					.toArray(),
			),
			model: [
				...this.model,
				{
					text: this.displayName,
					height: 0.2,
					offset: [0, 0.5, 0],
					rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
					font: '"Comic Sans MS"',
				},
			],
		};
	}

	setSpeed(speed: number) {
		this.walkSpeed = speed;
	}
}
