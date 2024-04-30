import { Entity } from "./Entity";
import * as phys from "cannon-es";
import { Quaternion, Vector3 } from "../../common/commontypes";
import type { ModelId } from "../../common/models";
import { PhysicsWorld, q4, v3 } from "../physics";
import { SerializedEntity } from "../../common/messages";
import { GroundMaterial } from "../materials/SourceMaterials";

export class PlaneEntity extends Entity {
	// name: string;
	// type: string;
	// body: phys.Body;
	// model: ModelId[];

	constructor(name: string, pos: Vector3, rotation: Quaternion, model: ModelId[] = []) {
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
			collisionFilterGroup: Entity.ENVIRONMENT_COLLISION_GROUP,
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
