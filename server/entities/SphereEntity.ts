import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";
import { Game } from "../Game";

export class SphereEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: EntityModel[];

	constructor(game: Game, pos: Vector3, radius: number, model: EntityModel[] = []) {
		super(game, model);
		this.type = "sphere";
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
