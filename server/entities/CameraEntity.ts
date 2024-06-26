import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class CameraEntity extends Entity {
	constructor(game: Game, pos: Vector3, rotation: [number, number, number], id: string) {
		super(game, [], undefined, id);

		this.body = new phys.Body({
			type: phys.BODY_TYPES.STATIC,
			shape: new phys.Sphere(0.05),
			quaternion: new phys.Quaternion().setFromEuler(...(rotation.map(x=>(x/180)*Math.PI) as [number, number, number]), "YXZ"),
			position: new phys.Vec3(...pos),
		});
	}
}
