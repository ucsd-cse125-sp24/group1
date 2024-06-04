import * as phys from "cannon-es";
import { PhysicsWorld } from "../PhysicsWorld";
import { EntityModel, SerializedEntity } from "../../common/messages";
import { Vector3 } from "../../common/commontypes";
import { Game } from "../Game";

export type Tag = "environment" | "interactable" | "player" | "resource" | "tool" | "item";

export type EntityId = string;

let nextId = 0;

export abstract class Entity {
	/**
	 * Autogenerated unique ID for each entity. Not intended to be human-readable.
	 */
	id: EntityId;
	game: Game;
	body: phys.Body;
	model: EntityModel[];
	// tags system is very helpful for scalablilities and is also used in Unity
	// example: a crafting table entity that players can also jump on
	tags: Set<Tag>;
	/** Whether the entity is a player. */
	isPlayer = false;
	/**
	 * Whether the object is fixed and stationary and can't or won't move. If
	 * true, the entity makes for a great candidate for pre-calculating shadows.
	 */
	isStatic = false;

	constructor(game: Game, model: EntityModel[] = [], tags: Tag[] = [], id?: EntityId) {
		this.game = game;
		this.id = id ?? (++nextId).toString(16);
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

	serialize(): SerializedEntity {
		return {
			id: this.id,
			model: this.model,
			position: this.body.position.toArray(),
			quaternion: this.body.quaternion.toArray(),
			isStatic: this.isStatic,
		};
	}

	/**
	 * Used for collisions and selecting items so that you can jump on both ramps
	 * and crafting tables, as well as not pick up items through walls.
	 */
	static readonly EPSILON = 0.1;

	getBitFlag(): number {
		if (this.tags.size == 0) return -1;

		let flag = 0;

		if (flag == 0) return -1;
		return flag;
	}

	/** For logging entities to the console while debugging */
	toString(tag = ""): string {
		// Return class name
		return `${this.constructor.name}${tag}(${this.getPos().map((n) => n.toFixed(0))})`;
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
