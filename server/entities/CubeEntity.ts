import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../PhysicsWorld";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class CubeEntity extends Entity {
	constructor(
		game: Game,
		pos: Vector3,
		halfExtents: [number, number, number],
		isStatic: boolean,
		model: EntityModel[] = [],
	) {
		super(game, model);

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Box(v3(...halfExtents)),
			material: SlipperyMaterial,
			collisionFilterGroup: this.getBitFlag(),
			type: isStatic ? phys.Body.STATIC : phys.Body.DYNAMIC,
		});
	}

	serialize(): SerializedEntity {
		return {
			isStatic: this.body.type === phys.Body.STATIC,
			id: this.id,
			model: this.model,

			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
		};
	}
}
