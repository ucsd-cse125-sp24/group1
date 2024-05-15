import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { TheWorld } from "../physics";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";

export abstract class PlayerEntity extends Entity {
	type: string;
	name: string;
	body: phys.Body;
	onGround: boolean;
	lookDir: phys.Vec3;

	model: EntityModel[];

	// Game properties
	interactionRange: number;
	speed: number;
	itemInHands: null | Item;

	constructor(name: string, pos: Vector3, model: EntityModel[] = [], speed: number) {
		super(name, model);

		this.type = "player";
		this.name = name;
		this.model = model;
		this.tags.add("player");

		this.itemInHands = null;
		this.interactionRange = 1.0;
		this.lookDir = new phys.Vec3(0, -1, 0);

		// Magic numbers!!! WOOHOO
		this.speed = speed;
		this.onGround = false;

		this.body = new phys.Body({
			mass: 1.0, //fuckable
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: PlayerMaterial,
		});
	}

	abstract move(movement: MovementInfo): void;

	abstract serialize(): SerializedEntity;

	checkOnGround(): void {
		// apparently this generate a ray segment and only check intersection within that segment
		const checkerRay = new phys.Ray(this.body.position, this.body.position.vadd(new phys.Vec3(0, -1, 0)));
		const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.ENVIRONMENT_COLLISION_GROUP,
			checkCollisionResponse: false,
		});
		// console.log(checkerRay);
		// console.log(result);

		this.onGround = false;
		if (result.hasHit) {
			if (result.distance <= 0.5 + Entity.EPSILON) {
				this.onGround = true;
			}
		}
	}

	lookForInteractables(): phys.Body | null {
		const checkerRay = new phys.Ray(
			this.body.position,
			this.body.position.vadd(this.lookDir.scale(this.interactionRange)),
		);

		const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.INTERACTABLE_COLLISION_GROUP,
			checkCollisionResponse: false,
		});

		return result.body;
	}

	setSpeed(speed: number) {
		this.speed = speed;
	}
}
