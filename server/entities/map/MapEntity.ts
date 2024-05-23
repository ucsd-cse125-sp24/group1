import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../../common/messages";
import { Game } from "../../Game";
import { GroundMaterial } from "../../materials/SourceMaterials";
import { StaticEntity } from "../StaticEntity";
import { MapCollider } from "./colliders";

export class MapEntity extends StaticEntity {
	constructor(game: Game, position: Vector3, colliders: MapCollider[], model: EntityModel[] = []) {
		super(game, position, undefined, GroundMaterial, model);
		for (const { shape, offset, rotation } of colliders) {
			this.body.addShape(shape, offset, rotation);
		}
		this.tags.add("environment");
		this.body.collisionFilterGroup = this.getBitFlag();
	}
}
