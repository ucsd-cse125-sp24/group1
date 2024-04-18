import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { PhysicsWorld, TheWorld } from "../physics";

export class PlayerEntity implements Entity {
	type: string;
	name: string;
	body: phys.Body;
	model: string[];

	constructor(name: string, pos: Vector3, model: string[] = []) {
		this.type = "player";
		this.name = name;
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0, //fuckable
			position: new phys.Vec3(...pos),
			fixedRotation: true,
		});

		// Add player cylinder
		this.body.addShape(
			new phys.Cylinder(
				0.5, // Top radius
				0.5, // Bottom radius
				0.5, // Height
				12, // Number of Cylinder segments
			),
		);

		// Add player capsule top
		this.body.addShape(new phys.Sphere(0.25), new phys.Vec3(0, 0.25, 0));

		// Add player capsule bottom
		this.body.addShape(new phys.Sphere(0.25), new phys.Vec3(0, -0.25, 0));
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
}
