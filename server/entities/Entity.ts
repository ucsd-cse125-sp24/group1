import * as phys from "cannon-es";
import type { ModelId } from "../../common/models";
import { PhysicsWorld } from "../physics";
import { SerializedEntity } from "../../common/messages";

export abstract class Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: ModelId[];

	constructor(name: string, model: ModelId[] = []) {
		this.name = name;
		this.type = "entity";
		this.body = new phys.Body();
		this.model = model;
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

	abstract serialize(): SerializedEntity;
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
