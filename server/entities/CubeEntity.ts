import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import { v3 } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";

export class CubeEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: ModelId[];

	constructor(name: string, pos: Vector3, model: EntityModel[] = []) {
		super(name, model);
		this.name = name;
		this.type = "cube";
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Box(v3(1, 1, 2)),
			material: SlipperyMaterial,
		});
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: [
				{
					type: "box",
					size: (this.body.shapes[0] as phys.Box).halfExtents.toArray(),
				},
			],
		};
	}
}
