import * as phys from "cannon-es";
import { Vector3 } from "../../common/commontypes";
import type { ModelId } from "../../common/models";
import { v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";

export class SphereEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: ModelId[];

	constructor(name: string, pos: Vector3, radius: number, model: ModelId[] = []) {
		super(name, model);
		this.type = "sphere";
		this.name = name;
		this.model = model;

		this.body = new phys.Body({
			mass: 1.0,
			position: v3(...pos),
			shape: new phys.Sphere(radius),
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
					type: "sphere",
					radius: (this.body.shapes[0] as phys.Sphere).radius,
				},
			],
		};
	}
}
