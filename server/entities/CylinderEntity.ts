import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../PhysicsWorld";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class CylinderEntity extends Entity {
	static NUM_SEGMENTS = 20;

	// name: string;
	// type: string;
	// body: phys.Body;
	// model: EntityModel[];

	constructor(game: Game, pos: Vector3, radius: number, height: number, model: EntityModel[] = []) {
		super(game, model);
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Cylinder(radius, radius, height, CylinderEntity.NUM_SEGMENTS),
			collisionFilterGroup: this.getBitFlag(),
		});
	}
}
