import { Vector3 } from "../../../common/commontypes";
import { EntityModel } from "../../../common/messages";
import { StaticEntity } from "../StaticEntity";
import { MapCollider } from "./colliders";

export class MapEntity extends StaticEntity {
	constructor(name: string, position: Vector3, colliders: MapCollider[], model: EntityModel[] = []) {
		super(name, position, undefined, model);
		for (const { shape, offset, rotation } of colliders) {
			this.body.addShape(shape, offset, rotation);
		}
	}
}
