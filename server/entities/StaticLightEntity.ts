import { Vec3 } from "cannon-es";
import { SerializedEntity, SerializedLight } from "../../common/messages";
import { StaticEntity } from "./StaticEntity";
import { Game } from "../Game";
import { SlipperyMaterial } from "../materials/SourceMaterials";
import { Vector3 } from "../../common/commontypes";

export class StaticLightEntity extends StaticEntity {
	light: Omit<SerializedLight, "willMove">;

	constructor(game: Game, position: Vector3, light: Omit<SerializedLight, "willMove">) {
		super(game, position, undefined, SlipperyMaterial);
		this.light = light;
	}

	serialize(): SerializedEntity {
		return {
			...super.serialize(),
			light: {
				...this.light,
				willMove: false,
			},
		};
	}
}
