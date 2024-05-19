import * as phys from "cannon-es";
import { PhysicsWorld } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";

export type Tag = "environment" | "interactable" | "player" | "resource" | "tool" | "item";

export abstract class Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: EntityModel[];
	// tags system is very helpful for scalablilities and is also used in Unity
	// example: a crafting table entity that players can also jump on
	tags: Set<Tag>;

	constructor(name: string, model: EntityModel[] = [], tags: Tag[] = []) {
		this.name = name;
		this.type = "entity";
		this.body = new phys.Body();
		this.model = model;
		this.tags = new Set(tags);
	}

	getPos(): phys.Vec3 {
		return this.body.position;
	}
	getRot(): phys.Quaternion {
		return this.body.quaternion;
	}
	addToWorld(world: PhysicsWorld): void {
		world.addBody(this.body);
	}
	removeFromWorld(world: PhysicsWorld): void {
		world.removeBody(this.body);
	}

	onCollide(otherEntity: Entity): void {
		// console.log("wow collide");
	}

	abstract serialize(): SerializedEntity;

	static readonly ENVIRONMENT_COLLISION_GROUP = 2;
	static readonly INTERACTABLE_COLLISION_GROUP = 4;
	static readonly EPSILON = 0.1;

	getBitFlag(): number {
		if (this.tags.size == 0) return -1;

		let flag = 0;
		if (this.tags.has("environment")) flag |= Entity.ENVIRONMENT_COLLISION_GROUP;
		if (this.tags.has("interactable")) flag |= Entity.INTERACTABLE_COLLISION_GROUP;
		return flag;
	}
}

/**
 * TO MAKE:
 * PLAYER ENTITY
 *     HERO ENTITY
 *     BOSS ENTITY
 * ITEM ENTITY
 *     RESOURCE ENTITY
 *     TOOL ENTITY
 * MAP ENTITY
 * DOOR ENTITY
 *
 */
