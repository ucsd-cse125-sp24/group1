import { Entity } from "./entity";
import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";

export class CubeEntity implements Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: number;

	constructor(name: string, pos: Vector3, modelNumder: number) {
		this.type = "cube";
		this.name = name;
		this.model = modelNumder;

		this.body = new phys.Body({
			mass: 1.0,
			position: new phys.Vec3(...pos),
		});

		this.body.addShape(
			new phys.Shape({
				type: phys.SHAPE_TYPES.BOX,
			}),
		);
	}

	getPos() {
		return this.body.position;
	}

	getRot() {
		return this.body.quaternion;
	}
}
