import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { PhysicsWorld, TheWorld, v3 } from "../physics";

export class CubeEntity implements Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: string[];

	constructor(name: string, pos: Vector3, model: string[] = []) {
		this.type = "cube";
		this.name = name;
		this.model = model;

		/*

		const size = 1
		const halfExtents = new CANNON.Vec3(size, size, size)
		const boxShape = new CANNON.Box(halfExtents)
		const boxBody = new CANNON.Body({ mass: 1, shape: boxShape })
		world.addBody(boxBody)
		*/

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
		});

		this.body.addShape(new phys.Box(v3(1, 1, 2)));
	}

	getPos() {
		return this.body.position;
	}

	getRot() {
		return this.body.quaternion;
	}

	addToWorld(world: PhysicsWorld): void {
		world.addBody(this.body);
	}
}
