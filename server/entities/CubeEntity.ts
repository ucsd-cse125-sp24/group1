import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../PhysicsWorld";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class CubeEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: ModelId[];

	constructor(game: Game, pos: Vector3, model: EntityModel[] = []) {
		super(game, model);
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Box(v3(1, 1, 2)),
			material: SlipperyMaterial,
			collisionFilterGroup: this.getBitFlag(),
		});
	}

	serialize(): SerializedEntity {
		return {
			id: this.id,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
		};
	}
}
