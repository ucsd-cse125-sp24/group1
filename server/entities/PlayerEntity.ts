import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import type { Model } from "../../common/models";
import { PhysicsWorld, TheWorld } from "../physics";
import { SerializedEntity } from "../../common/messages";

export class PlayerEntity implements Entity {
	type: string;
	name: string;
	body: phys.Body;
	model: Model[];

	// shapes
	cylinder: phys.Cylinder;
	sphereTop: phys.Sphere;
	sphereBot: phys.Sphere;

	constructor(name: string, pos: Vector3, model: Model[] = []) {
		this.type = "player";
		this.name = name;
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0, //fuckable
			position: new phys.Vec3(...pos),
			fixedRotation: true,
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

	getPos() {
		return this.body.position;
	}

	getRot() {
		return this.body.quaternion;
	}

	move(direction?: phys.Vec3) {
		this.body.applyForce(direction || new phys.Vec3(5, 5, 5));
	}

	addToWorld(world: PhysicsWorld): void {
		world.addBody(this.body);
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
