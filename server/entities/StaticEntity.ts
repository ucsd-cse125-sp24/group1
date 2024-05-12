import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { Entity } from "./Entity";
import { ModelId } from "../../common/models";
import { v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";

export class StaticEntity extends Entity {
	constructor(name: string, position: Vector3, shape: phys.Shape, model: ModelId[] = []) {
		super(name, model);
		this.type = "static";
		this.body = new phys.Body({
			position: v3(...position),
			type: phys.Body.STATIC,
			shape: shape,
		});
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [],
		};
	}
}
