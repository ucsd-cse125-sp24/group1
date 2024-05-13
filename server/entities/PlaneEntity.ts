import * as phys from "cannon-es";
import { Quaternion, Vector3 } from "../../common/commontypes";
import { q4, v3 } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { GroundMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";

export class PlaneEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: EntityModel[];

	constructor(name: string, pos: Vector3, rotation: Quaternion, model: EntityModel[] = []) {
		super(name, model);
		this.type = "plane";
		this.name = name;
		this.model = model;
		this.tags.add("environment");

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: v3(...pos),
			quaternion: q4(...rotation).normalize(),
			fixedRotation: true,
			shape: new phys.Plane(),
			material: GroundMaterial,
			collisionFilterGroup: this.getBitFlag(),
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
					type: "plane",
				},
			],
		};
	}
}
