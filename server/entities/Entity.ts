import * as phys from "cannon-es";
import type { ModelId } from "../../common/models";
import { PhysicsWorld } from "../physics";
import { SerializedEntity } from "../../common/messages";

export abstract class Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: ModelId[];
	// tags system is very helpful for scalablilities and is also used in Unity
	// example: a crafting table entity that players can also jump on
	tags: Set<string>;

	constructor(name: string, model: ModelId[] = []) {
		this.name = name;
		this.type = "entity";
		this.body = new phys.Body();
		this.model = model;
		this.tags = new Set();
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
	static readonly EPSILON = 0.01;
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
