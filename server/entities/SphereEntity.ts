import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../PhysicsWorld";
import { EntityModel } from "../../common/messages";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class SphereEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: EntityModel[];

	constructor(game: Game, pos: Vector3, radius: number, model: EntityModel[] = []) {
		super(game, model);
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Sphere(radius),
			material: SlipperyMaterial,
			collisionFilterGroup: this.getBitFlag(),
		});
	}
}
