import { Box } from "cannon-es";
import { Vector3 } from "../../../common/commontypes";
import { EntityModel, SerializedCollider, SerializedEntity } from "../../../common/messages";
import { GroundMaterial } from "../../materials/SourceMaterials";
import { StaticEntity } from "../StaticEntity";
import { MapCollider } from "./colliders";

export class MapEntity extends StaticEntity {
	constructor(name: string, position: Vector3, colliders: MapCollider[], model: EntityModel[] = []) {
		super(name, position, undefined, GroundMaterial, model);
		for (const { shape, offset, rotation } of colliders) {
			this.body.addShape(shape, offset, rotation);
		}
		this.tags.add("environment");
		this.body.collisionFilterGroup = this.getBitFlag();
	}

	serialize(): SerializedEntity {
		return {
			name: this.name,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			colliders: this.body.shapes.map(
				(shape, i): SerializedCollider => ({
					type: "box",
					size: (shape as Box).halfExtents.toArray(),
					offset: this.body.shapeOffsets[i].toArray(),
					orientation: this.body.shapeOrientations[i].toArray(),
				}),
			),
		};
	}
}
