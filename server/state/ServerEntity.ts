import { SerializedEntity } from "../../common/messages";

export class ServerEntity {
	geometryId: string;
	materialId: string;
	collisions: "todo"[] = [];

	constructor(geometryId: string, materialId: string) {
		this.geometryId = geometryId;
		this.materialId = materialId;
	}

	toJSON(): SerializedEntity {
		return {
			geometryId: this.geometryId,
			materialId: this.materialId,
			collisions: [{ type: "box", center: [0, 0, 0], size: [1, 1, 1] }],
		};
	}
}
