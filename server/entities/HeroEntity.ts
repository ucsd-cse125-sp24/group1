import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import type { ModelId } from "../../common/models";
import { SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { TheWorld } from "../physics";
import { PlayerEntity } from "./PlayerEntity";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";

export class HeroEntity extends PlayerEntity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];

	// Game properties
	speed: number;
	jumping: boolean;

	// shapes
	cylinder: phys.Cylinder;
	sphereTop: phys.Sphere;
	sphereBot: phys.Sphere;
	onGround: boolean;

	constructor(name: string, pos: Vector3, model: ModelId[] = []) {
		super(name, pos, model, 100);

		this.type = "player-hero";
		this.name = name;
		this.model = model;

		// Magic numbers!!! WOOHOO
		this.speed = 100;
		this.jumping = false;
		this.onGround = false;

		this.body = new phys.Body({
			mass: 1.0, //fuckable
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: PlayerMaterial,
		});

		// Add player cylinder
		this.cylinder = new phys.Cylinder(
			0.5, // Top radius
			0.5, // Bottom radius
			0.5, // Height
			12, // Number of Cylinder segments
		);

		this.sphereTop = new phys.Sphere(0.25);
		this.sphereBot = new phys.Sphere(0.25);

		this.body.addShape(this.cylinder);

		// Add player capsule top
		this.body.addShape(this.sphereTop, new phys.Vec3(0, 0.25, 0));

		// Add player capsule bottom

		this.body.addShape(this.sphereBot, new phys.Vec3(0, -0.25, 0));
	}

	move(movement: MovementInfo) {
		//this is bugged!
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
			
		}

		if (this.body.force.length() < 1) {
			this.body.applyForce(movementVector.scale(this.speed));
		}
	}

	checkOnGround(): void {
		// apparently this generate a ray segment and only check intersection within that segment
		const checkerRay = new phys.Ray(this.body.position, this.body.position.vadd(new phys.Vec3(0, -1, 0)));
		const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.ENVIRONMENT_COLLISION_GROUP,
			checkCollisionResponse: false,
		});
		// console.log(checkerRay);
		// console.log(result);

		this.onGround = false;
		if (result.hasHit) {
			if (result.distance <= 0.5 + Entity.EPSILON) {
				this.onGround = true;
			}
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
				},
				{
					type: "sphere", //capsule Top
					radius: this.sphereTop.radius,
					offset: [0, 0.25, 0],
				},
				{
					type: "sphere", //capsule Bot
					radius: this.sphereBot.radius,
					offset: [0, -0.25, 0],
				},
			],
		};
	}
}
