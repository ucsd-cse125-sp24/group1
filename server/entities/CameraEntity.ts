import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { SerializedEntity } from "../../common/messages";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class CameraEntity extends Entity {
	constructor(game: Game, pos: Vector3, rotation: [number, number, number], id: string) {
		super(game, [], undefined, id);

		this.body = new phys.Body({
			type: phys.BODY_TYPES.STATIC,
			shape: new phys.Sphere(0.05),
			quaternion: new phys.Quaternion().setFromEuler(...rotation, "XYZ"),
			position: new phys.Vec3(...pos),
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
