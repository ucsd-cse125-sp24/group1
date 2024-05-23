import * as phys from "cannon-es";
import { Quaternion, Vector3 } from "../../common/commontypes";
import { q4, v3 } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { GroundMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";
import { Game } from "../Game";

export class PlaneEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: EntityModel[];

	constructor(game: Game, pos: Vector3, rotation: Quaternion, model: EntityModel[] = []) {
		super(game, model, ["environment"]);
		this.type = "plane";
		this.model = model;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: v3(...pos),
			quaternion: q4(...rotation).normalize(),
			fixedRotation: true,
			shape: new phys.Plane(),
			material: GroundMaterial,
			collisionFilterGroup: this.getBitFlag(), // ALWAYS SET TAGS BEFORE THIS!!
		});
	}
}
