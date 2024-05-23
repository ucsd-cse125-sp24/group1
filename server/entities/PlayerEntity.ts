import * as phys from "cannon-es";
import { quat, vec3 } from "gl-matrix";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";
import { BossEntity } from "./BossEntity";
import { Game } from "../Game";

const COYOTE_FRAMES = 10;

export abstract class PlayerEntity extends Entity {
	isPlayer = true;

	onGround: boolean;
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

		this.type = "player";

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

	move(movement: MovementInfo, onGroundResult: Entity[]): void {
		this.lookDir = new phys.Vec3(...movement.lookDir);

		this.onGround = onGroundResult.length > 0;

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
				new phys.Vec3(this.lookDir.x, 0, this.lookDir.z).unit().scale(this.#capsuleRadius + this.itemInHands.radius),
			);
			this.itemInHands.body.velocity = new phys.Vec3(0, 0, 0);
		}

		if (movement.jump && this.#coyoteCounter > 0) {
			const deltaVy = new phys.Vec3(0, this.jumpSpeed, 0).vsub(currentVelocity.vmul(new phys.Vec3(0, 1, 0)));
			this.body.applyImpulse(deltaVy.scale(this.body.mass));
		}
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
		};
	}

	// HACK: Entities do not have access to Game for some reason, so they must
	// provide the rays they wanted casted for the Game to execute

	checkOnGroundSegment(): phys.Ray {
		// apparently this generate a ray segment and only check intersection within that segment
		return new phys.Ray(
			this.body.position,
			this.body.position.vsub(new phys.Vec3(0, this.#cylinderHeight + this.#capsuleRadius + Entity.EPSILON, 0)),
		);
	}

	lookForInteractablesSegment(): phys.Ray {
		return new phys.Ray(this.body.position, this.body.position.vadd(this.lookDir.scale(this.interactionRange)));
	}

	setSpeed(speed: number) {
		this.walkSpeed = speed;
	}

	interact(player: PlayerEntity) {
		if (player instanceof BossEntity) {
			let temp = this.walkSpeed;
			// TODO STUN the Player
			this.walkSpeed = 0;
			// Wait 3 seconds

			setTimeout(() => {
				this.walkSpeed = temp;
			}, 3000);
		}
	}
}
