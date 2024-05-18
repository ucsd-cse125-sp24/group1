import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { TheWorld } from "../physics";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";

export abstract class PlayerEntity extends Entity {
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

	constructor(
		name: string,
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
		super(name, model, ["player"]);

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
		});

		this.#cylinder = new phys.Cylinder(this.#capsuleRadius, this.#capsuleRadius, this.#cylinderHeight, 12);
		this.#sphereTop = new phys.Sphere(this.#capsuleRadius);
		this.#sphereBot = new phys.Sphere(this.#capsuleRadius);

		this.body.addShape(this.#cylinder, new phys.Vec3(0, -this.#cylinderHeight / 2, 0));
		this.body.addShape(this.#sphereTop);
		this.body.addShape(this.#sphereBot, new phys.Vec3(0, -this.#cylinderHeight, 0));
	}

	move(movement: MovementInfo): void {
		this.lookDir = new phys.Vec3(...movement.lookDir);

		this.checkOnGround();

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
			this.itemInHands.body.position = this.body.position.vadd(new phys.Vec3(0, 1, -0.5));
		}

		if (movement.jump && this.onGround) {
			const deltaVy = new phys.Vec3(0, this.jumpSpeed, 0).vsub(currentVelocity.vmul(new phys.Vec3(0, 1, 0)));
			this.body.applyImpulse(deltaVy.scale(this.body.mass));
		}
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "cylinder",
					radiusTop: this.#cylinder.radiusTop,
					radiusBottom: this.#cylinder.radiusBottom,
					height: this.#cylinder.height,
					numSegments: this.#cylinder.numSegments,
					offset: [0, -this.#cylinderHeight / 2, 0],
				},
				{
					type: "sphere", //capsule Top
					radius: this.#sphereTop.radius,
				},
				{
					type: "sphere", //capsule Bot
					radius: this.#sphereBot.radius,
					offset: [0, -this.#cylinderHeight, 0],
				},
			],
		};
	}

	checkOnGround(): void {
		// apparently this generate a ray segment and only check intersection within that segment
		const checkerRay = new phys.Ray(
			this.body.position,
			this.body.position.vsub(new phys.Vec3(0, this.#eyeHeight + Entity.EPSILON, 0)),
		);
		const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.ENVIRONMENT_COLLISION_GROUP,
			checkCollisionResponse: false,
		});

		this.onGround = result.hasHit;
	}

	lookForInteractables(): phys.Body | null {
		const checkerRay = new phys.Ray(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
		);

		const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.INTERACTABLE_COLLISION_GROUP,
			checkCollisionResponse: false,
		});

		return result.body;
	}

	setSpeed(speed: number) {
		this.walkSpeed = speed;
	}
}
