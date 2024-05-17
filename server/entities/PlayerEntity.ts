import * as phys from "cannon-es";
import { MovementInfo, Vector3 } from "../../common/commontypes";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { PlayerMaterial } from "../materials/SourceMaterials";
import { TheWorld } from "../physics";
import { Entity } from "./Entity";
import { Item } from "./Interactable/Item";

export abstract class PlayerEntity extends Entity {
	onGround: boolean;
	eyeHeight: number;
	lookDir: phys.Vec3;

	// Game properties
	interactionRange: number;
	speed: number;
	itemInHands: null | Item;

	constructor(
		name: string,
		pos: Vector3,
		model: EntityModel[] = [],
		speed: number,
		mass: number,
		interactionRange: number,
		eyeHeight: number,
	) {
		super(name, model);

		this.type = "player";
		this.tags.add("player");

		this.itemInHands = null;
		this.interactionRange = interactionRange;
		this.lookDir = new phys.Vec3(0, -1, 0);

		this.speed = speed;
		this.onGround = false;
		this.eyeHeight = eyeHeight;

		this.body = new phys.Body({
			mass: mass,
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: PlayerMaterial,
		});
	}

	abstract move(movement: MovementInfo): void;

	abstract serialize(): SerializedEntity;

	checkOnGround(): void {
		// apparently this generate a ray segment and only check intersection within that segment
		const bottomPoint = this.body.position.vsub(new phys.Vec3(0, this.eyeHeight - Entity.EPSILON * 0.1, 0));
		const checkerRay = new phys.Ray(bottomPoint, bottomPoint.vadd(new phys.Vec3(0, -1, 0)));
		const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.ENVIRONMENT_COLLISION_GROUP,
			checkCollisionResponse: false,
		});

		this.onGround = false;
		if (result.hasHit) {
			if (result.distance <= Entity.EPSILON) {
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
