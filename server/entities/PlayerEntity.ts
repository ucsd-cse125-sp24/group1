import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import type { ModelId } from "../../common/models";
import { SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";

export abstract class PlayerEntity extends Entity {
	type: string;
	name: string;
	body: phys.Body;
	model: ModelId[];

	// Game properties
	speed: number;

	constructor(name: string, pos: Vector3, model: ModelId[] = [], speed: number) {
		super(name, model);

		this.type = "player";
		this.name = name;
		this.model = model;
		this.tags.add("player");

		// Magic numbers!!! WOOHOO
		this.speed = speed;

		this.body = new phys.Body({
			mass: 1.0, //fuckable
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: PlayerMaterial,
		});
	}

	abstract move(movement: MovementInfo): void;

	abstract serialize(): SerializedEntity;
}
