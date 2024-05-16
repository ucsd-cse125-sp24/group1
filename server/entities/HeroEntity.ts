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

export class HeroEntity extends PlayerEntity {
	// Game properties
	jumping: boolean;

	// shapes
	cylinder: phys.Cylinder;
	sphereTop: phys.Sphere;
	sphereBot: phys.Sphere;

	constructor(name: string, pos: Vector3, model: EntityModel[] = []) {
		super(name, pos, model, 100, 3, PLAYER_INTERACTION_RANGE);

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

		let forwardVector = new phys.Vec3(movement.lookDir[0], 0, movement.lookDir[2]);
		forwardVector.normalize();

		let rightVector = forwardVector.cross(new phys.Vec3(0, 1, 0));

		let movementVector = new phys.Vec3(0, 0, 0);

		if (movement.forward) {
			movementVector = movementVector.vadd(forwardVector);
		}
		if (movement.backward) {
			movementVector = movementVector.vadd(forwardVector.negate());
		}
		if (movement.right) {
			movementVector = movementVector.vadd(rightVector);
		}
		if (movement.left) {
			movementVector = movementVector.vadd(rightVector.negate());
		}

		movementVector.normalize();

		// if (movement.forward) {
		// 	console.log(forwardVector);
		// 	console.log(movementVector);
		// }

		// if (movement.jump) console.log("jump");
		// if (this.onGround) console.log("based");

		if (this.itemInHands instanceof Item) {
			//this is a little janky ngl
			this.itemInHands.body.position = this.body.position.vadd(new phys.Vec3(0, 1, -0.5));
		}

		if (movement.jump && this.onGround) {
			// chatGPT for debug string

			const stringsArray = ["weeeee", "yahooooo", "mario", "yap", "hawaii"];
			const randomIndex = Math.floor(Math.random() * stringsArray.length);
			const randomString = stringsArray[randomIndex];
			console.log(randomString);

			this.body.applyImpulse(new phys.Vec3(0, 40, 0));
		}

		if (this.body.force.length() < 1) {
			this.body.applyForce(movementVector.scale(this.speed));
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
