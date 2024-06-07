import { Vector3 } from "../../../common/commontypes";
import { EntityModel } from "../../../common/messages";
import { Game } from "../../Game";
import { Collider, addColliders } from "../../lib/Collider";
import { GroundMaterial } from "../../materials/SourceMaterials";
import { StaticEntity } from "../StaticEntity";

export class MapEntity extends StaticEntity {
	constructor(game: Game, position: Vector3, colliders: Collider[], model: EntityModel[] = []) {
		super(game, position, undefined, GroundMaterial, model);
		addColliders(this.body, colliders);
		this.tags.add("environment");
		this.body.collisionFilterGroup = this.getBitFlag();
	}
}
