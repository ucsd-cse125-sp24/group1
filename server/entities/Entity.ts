import * as phys from "cannon-es";
import type { Model } from "../../common/models";
import { PhysicsWorld } from "../physics";
import { SerializedEntity } from "../../common/messages";

export interface Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: Model[];

	getPos: () => phys.Vec3;
	getRot: () => phys.Quaternion;
	addToWorld(world: PhysicsWorld): void;
	removeFromWorld(world: PhysicsWorld): void;

	serialize: () => SerializedEntity;
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
