import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";

export abstract class PlayerEntity extends Entity {
	type: string;
	name: string;
	body: phys.Body;
	model: EntityModel[];

	// Game properties
	speed: number;
	itemInHands: null | Item;

	constructor(name: string, pos: Vector3, model: EntityModel[] = [], speed: number) {
		super(name, model);

		this.type = "player";
		this.name = name;
		this.model = model;
		this.tags.add("player");

		this.itemInHands = null;

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

	setSpeed(speed: number) {
		this.speed = speed;
	}
}
