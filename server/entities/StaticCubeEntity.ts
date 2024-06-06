import { Box } from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { EntityModel } from "../../common/messages";
import { Game } from "../Game";
import { v3 } from "../PhysicsWorld";
import { GroundMaterial } from "../materials/SourceMaterials";
import { StaticEntity } from "./StaticEntity";

export class StaticCubeEntity extends StaticEntity {
	constructor(game: Game, position: Vector3, halfExtents: [number, number, number], model: EntityModel[] = []) {
		super(game, position, undefined, GroundMaterial, model);
		this.body.addShape(new Box(v3(...halfExtents)));
		this.tags.add("environment");
		this.body.collisionFilterGroup = this.getBitFlag();
	}
}
