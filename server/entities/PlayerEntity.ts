import { Entity } from "./entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { TheWorld } from "../physics";

export class PlayerEntity implements Entity {
	type: string;
	name: string;
	body: phys.Body;
	model: number;

	constructor(name: string, pos: Vector3, modelNumber: number) {
		this.type = "player";
		this.name = name;
		this.model = modelNumber;

		this.body = new phys.Body({
			mass: 1.0, //fuckable
			position: new phys.Vec3(...pos),
			fixedRotation: true
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

		TheWorld.addBody(this.body);
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
}