import * as phys from "cannon-es";
import { PhysicsWorld } from "../physics";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { Vector3 } from "../../common/commontypes";

export type Tag = "environment" | "interactable" | "player" | "resource" | "tool" | "item";

export abstract class Entity {
	name: string;
	type: string;
	body: phys.Body;
	model: EntityModel[];
	// tags system is very helpful for scalablilities and is also used in Unity
	// example: a crafting table entity that players can also jump on
	tags: Set<Tag>;
	/** Whether the entity is a player. */
	isPlayer = false;

	constructor(name: string, model: EntityModel[] = [], tags: Tag[] = []) {
		this.name = name;
		this.type = "entity";
		this.model = model;
		this.tags = new Set(tags);
		this.body = new phys.Body({
			collisionFilterGroup: this.getBitFlag(),
		});
	}

	getPos(): Vector3 {
		return [this.body.position.x, this.body.position.y, this.body.position.z];
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

	/**
	 * Used for collisions and selecting items so that you can jump on both ramps
	 * and crafting tables, as well as not pick up items through walls.
	 */
	static readonly PLAYER_COLLISION_GROUP = 2;
	static readonly NONPLAYER_COLLISION_GROUP = 4;
	static readonly EPSILON = 0.1;

	getBitFlag(): number {
		if (this.tags.size == 0) return -1;

		let flag = 0;
		if (this.isPlayer) flag |= Entity.PLAYER_COLLISION_GROUP;
		else flag |= Entity.NONPLAYER_COLLISION_GROUP;

		if (flag == 0) return -1;
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
