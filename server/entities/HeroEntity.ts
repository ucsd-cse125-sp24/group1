import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerEntity } from "./PlayerEntity";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";

const PLAYER_INTERACTION_RANGE = 2.0;
const PLAYER_CAPSULE_HEIGHT = 2;
const PLAYER_CAPSULE_RADIUS = 0.5;
const cylinderHeight = PLAYER_CAPSULE_HEIGHT - 2 * PLAYER_CAPSULE_RADIUS;
/** Maximum change in velocity that can be caused by the player in one tick */
const MAX_USER_VELOCITY_CHANGE = 8;

export class HeroEntity extends PlayerEntity {
	// Game properties
	jumping: boolean;

	// shapes
	cylinder: phys.Cylinder;
	sphereTop: phys.Sphere;
	sphereBot: phys.Sphere;

	constructor(name: string, pos: Vector3, model: EntityModel[] = []) {
		super(name, pos, model, 10, 3, PLAYER_INTERACTION_RANGE);

		this.type = "player-hero";
		this.jumping = false;

		// Add player cylinder
		this.cylinder = new phys.Cylinder(
			PLAYER_CAPSULE_RADIUS, // Top radius
			PLAYER_CAPSULE_RADIUS, // Bottom radius
			cylinderHeight, // Height
			12, // Number of Cylinder segments
		);

		this.sphereTop = new phys.Sphere(PLAYER_CAPSULE_RADIUS);
		this.sphereBot = new phys.Sphere(PLAYER_CAPSULE_RADIUS);

		this.body.addShape(this.cylinder, new phys.Vec3(0, -cylinderHeight / 2, 0));

		// Add player capsule top
		this.body.addShape(this.sphereTop);

		// Add player capsule bottom
		this.body.addShape(this.sphereBot, new phys.Vec3(0, -cylinderHeight, 0));
	}

	move(movement: MovementInfo) {
		this.lookDir = new phys.Vec3(...movement.lookDir);

		this.checkOnGround();

		const forwardVector = new phys.Vec3(movement.lookDir[0], 0, movement.lookDir[2]);
		forwardVector.normalize();
		const rightVector = forwardVector.cross(new phys.Vec3(0, 1, 0));
		const currentHorizontalVelocity = this.body.velocity.vmul(new phys.Vec3(1, 0, 1));

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
		targetVelocity = targetVelocity.scale(this.speed);

		let impulse = targetVelocity.vsub(currentHorizontalVelocity);
		if (impulse.length() > MAX_USER_VELOCITY_CHANGE) {
			impulse = impulse.scale(MAX_USER_VELOCITY_CHANGE / impulse.length());
		}
		this.body.applyImpulse(impulse.scale(this.body.invMass));

		if (this.itemInHands instanceof Item) {
			//this is a little janky ngl
			this.itemInHands.body.position = this.body.position.vadd(new phys.Vec3(0, 1, -0.5));
		}

		if (movement.jump && this.onGround) {
			this.body.applyImpulse(new phys.Vec3(0, 40, 0));
		}
	}

	override onCollide(otherEntity: Entity): void {}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "cylinder",
					radiusTop: this.cylinder.radiusTop,
					radiusBottom: this.cylinder.radiusBottom,
					height: this.cylinder.height,
					numSegments: this.cylinder.numSegments,
					offset: [0, -cylinderHeight / 2, 0],
				},
				{
					type: "sphere", //capsule Top
					radius: this.sphereTop.radius,
				},
				{
					type: "sphere", //capsule Bot
					radius: this.sphereBot.radius,
					offset: [0, -cylinderHeight, 0],
				},
			],
		};
	}
}
