import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { Entity } from "./Entity";
import { Game } from "../Game";

export class StaticEntity extends Entity {
	constructor(
		game: Game,
		position: Vector3,
		shape: phys.Shape | undefined,
		material: phys.Material,
		model: EntityModel[] = [],
	) {
		super(game, model);
		this.type = "static";
		this.body = new phys.Body({
			position: v3(...position),
			type: phys.Body.STATIC,
			shape: shape,
			material: material,
			collisionFilterGroup: this.getBitFlag(),
		});
	}
}
