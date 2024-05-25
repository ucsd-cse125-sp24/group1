/**
 * This manages the entire state of the game. Any gameplay specific elements
 * should be placed into this file or included into this file, and any interactions
 * that affect the state of the game must eventually be guaranteed to pass through
 * this class.
 *
 * This class serves as the ground source of truth for anything concerning the game
 */

import * as phys from "cannon-es";
import { Body } from "cannon-es";
import { ClientMessage, SerializedBody, SerializedEntity, ServerMessage } from "../common/messages";
import { MovementInfo } from "../common/commontypes";
import { sampleMapColliders } from "../assets/models/sample-map-colliders/server-mesh";
import { ModelId } from "../assets/models";
import { PlayerInput } from "./net/PlayerInput";
import { PlayerEntity } from "./entities/PlayerEntity";
import { BossEntity } from "./entities/BossEntity";
import { Entity, EntityId } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { SphereEntity } from "./entities/SphereEntity";
import { CylinderEntity } from "./entities/CylinderEntity";
import { Connection, ServerHandlers } from "./net/Server";
import { HeroEntity } from "./entities/HeroEntity";
import { getColliders } from "./entities/map/colliders";
import { MapEntity } from "./entities/map/MapEntity";
import { Item } from "./entities/Interactable/Item";
import { CraftingTable } from "./entities/Interactable/CraftingTable";
import { log } from "./net/_tempDebugLog";
import { PhysicsWorld } from "./PhysicsWorld";

// TEMP? (used for randomization)
const playerModels: ModelId[] = ["samplePlayer", "player_blue", "player_green", "player_red", "player_yellow"];
const itemModels: ModelId[] = [
	"axe",
	"bow",
	"gamer_bow",
	"gamer_sword",
	"iron",
	"knife",
	"magic_sauce",
	"mushroom",
	"pickaxe",
	"raw_iron",
	"shears",
	"string",
	"sword",
	"wood",
];

interface NetworkedPlayer {
	input: PlayerInput;
	entity: PlayerEntity;
	id: string;
	conn: Connection<ServerMessage>;
}

export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	#world = new PhysicsWorld({ gravity: [0, -60, 0] });

	#players: Map<string, NetworkedPlayer>;
	#createdInputs: PlayerInput[];

	#entities: Map<EntityId, Entity>;
	#bodyToEntityMap: Map<Body, Entity>;

	//Tyler is creating this so like. Might need to change
	#toCreateQueue: Entity[];
	#toDeleteQueue: EntityId[];

	constructor() {
		this.#createdInputs = [];
		this.#players = new Map();
		this.#entities = new Map();
		this.#bodyToEntityMap = new Map();

		this.#toCreateQueue = [];
		this.#toDeleteQueue = [];
	}

	/**
	 * Registers an entity in the physics world and in the game state
	 * so that it can be interacted with. Unregistered entities do not
	 * affect the game in any way
	 * @param entity the constructed entity to register
	 *
	 * NOTE: After the world has been created, use `addToCreateQueue` to avoid
	 * issues while creating or removing entities during a tick.
	 */
	#registerEntity(entity: Entity) {
		this.#entities.set(entity.id, entity);
		this.#bodyToEntityMap.set(entity.body, entity);

		// this is one way to implement collision that uses bodyToEntityMap without passing Game reference to entities
		entity.body.addEventListener(Body.COLLIDE_EVENT_NAME, (params: { body: Body; contact: any }) => {
			const otherBody: Body = params.body;
			const otherEntity: Entity | undefined = this.#bodyToEntityMap.get(otherBody);
			if (otherEntity) entity.onCollide(otherEntity);
		});

		entity.addToWorld(this.#world);
	}

	/**
	 * NOTE: After the world has been created, use `addToDeleteQueue` to avoid
	 * issues while creating or removing entities during a tick.
	 */
	#unregisterEntity(entity: Entity) {
		this.#entities.delete(entity.id);
		this.#bodyToEntityMap.delete(entity.body);
		entity.removeFromWorld(this.#world);
	}

	/**
	 * Checks for objects intersecting a line segment (*not* a ray) from `start`
	 * to `end`.
	 *
	 * TODO: Do we need to sort this? It's currently kind of hard to line items
	 * up (they're all spheres), so I can't test this.
	 *
	 * IMPORTANT: `Ray.intersectWorld` does NOT return the closest object. Do not
	 * use it.
	 */
	raycast(start: phys.Vec3, end: phys.Vec3, rayOptions: phys.RayOptions): Entity[] {
		return Array.from(
			new Set(
				this.#world.castRay(start, end, rayOptions).flatMap(({ body }) => {
					const entity = body && this.#bodyToEntityMap.get(body);
					return entity ? [entity] : [];
				}),
			),
		);
	}

	/**
	 * A function that sets up the base state for the game
	 */
	async setup() {
		const mapColliders = getColliders(await sampleMapColliders);
		const mapEntity = new MapEntity(this, [0, -5, 0], mapColliders, [{ modelId: "sampleMap" }]);
		this.#registerEntity(mapEntity);

		let plane = new PlaneEntity(this, [0, -10, 0], [-1, 0, 0, 1], []);
		this.#registerEntity(plane);

		let bigIron = new Item(this, "iron-ore", 0.5, [18, 0, 15], [{ modelId: "samplePlayer", scale: 0.5 }], "resource");
		this.#registerEntity(bigIron);

		let smallIron = new Item(this, "iron-ore", 0.5, [10, 0, 10], [{ modelId: "samplePlayer", scale: 0.5 }], "resource");

		this.#registerEntity(smallIron);

		let Pick = new Item(this, "pickaxe", 0.5, [15, 0, 15], [{ modelId: "fish1", scale: 0.75 }], "tool");
		this.#registerEntity(Pick);

		let tempCrafter = new CraftingTable(
			this,
			[18, 0, 18],
			[{ modelId: "fish1", scale: 10 }],
			[{ ingredients: ["iron-ore", "iron-ore"], output: "debug" }],
		);

		this.#registerEntity(tempCrafter);
	}

	updateGameState() {
		for (let [id, player] of this.#players.entries()) {
			let inputs = player.input.getInputs();
			let posedge = player.input.getPosedge();

			// Make dedicated movement information object to avoid letting the
			// player entity
			let movement: MovementInfo = {
				forward: inputs.forward,
				backward: inputs.backward,
				right: inputs.right,
				left: inputs.left,
				jump: inputs.jump,
				lookDir: inputs.lookDir,
			};

			player.entity.move(movement);

			if (posedge.use) {
				player.entity.use();
			}
			if (posedge.attack) {
				player.entity.attack();
			}
			if (posedge.emote) {
				// TEMP: using `emote` key (X) to spawn item above player
				const modelId = itemModels[Math.floor(Math.random() * itemModels.length)];
				this.addToCreateQueue(
					// TODO: other parameters?
					new Item(
						this,
						"iron-ore",
						0.5,
						// Max: (25, 20) Min: (-24, -17)
						player.entity.body.position.vadd(new phys.Vec3(0, 2, 0)).toArray(),
						[{ modelId, offset: [0, -0.5, 0], scale: 0.5 }],
						"resource",
					),
				);
				log(`Player ${player.id.slice(0, 6)} spawned ${modelId}`);
			}
		}
		this.#nextTick();
	}

	sabotageHero(id: EntityId) {
		const target = this.#getPlayerByEntityId(id);
		if (target && target.entity instanceof HeroEntity) {
			target.conn.send({ type: "sabotage-hero", time: 5000 });
			target.entity.sabotage();
		}
	}

	#getPlayerByEntityId(id: EntityId): NetworkedPlayer | undefined {
		for (const [_, player] of this.#players) {
			if (player.entity.id === id) {
				return player;
			}
		}
		return undefined;
	}

	handlePlayerJoin(conn: Connection<ServerMessage>) {
		console.log("Player joining!", this.#players.size);
		let player = this.#players.get(conn.id);
		if (player) {
			player.conn = conn;
		} else {
			let playerORHero = Math.floor(Math.random() * 4);
			let playerEntity;
			if (playerORHero % 4 == 0 || playerORHero % 4 == 1) {
				playerEntity = new HeroEntity(
					this,
					[20, -1, 20],
					[
						{
							modelId: playerModels[Math.floor(Math.random() * playerModels.length)],
							offset: [0, -1.5, 0],
							scale: 0.4,
						},
					],
				);
			} else {
				playerEntity = new BossEntity(
					this,
					[20, -1, 20],
					[
						{
							modelId: playerModels[Math.floor(Math.random() * playerModels.length)],
							offset: [0, -0.75, 0],
							scale: 0.2,
						},
					],
				);
			}
			this.addToCreateQueue(playerEntity);

			let input = new PlayerInput();
			this.#createdInputs.push(input);

			player = {
				id: conn.id,
				conn: conn,
				input: input,
				entity: playerEntity,
			};
			this.#players.set(conn.id, player);
		}

		conn.send({
			type: "camera-lock",
			entityId: player.entity.id,
			pov: "first-person", // player.entity instanceof BossEntity ? "top-down" : "first-person",
		});
	}

	/**
	 * Parses a raw websocket message, and then generates a response to the
	 * message if that is needed
	 * @param rawData the raw message data to process
	 * @param id A unique ID for the connection. Note that the same player may
	 * disconnect and reconnect, and this new connection will have a new ID.
	 * @returns a ServerMessage
	 */
	handleMessage(data: ClientMessage, conn: Connection<ServerMessage>): void {
		switch (data.type) {
			case "ping":
				conn.send({
					type: "pong",
				});
				break;
			case "pong":
				conn.send({
					type: "ping",
				});
				break;
			case "client-input":
				this.#players.get(conn.id)?.input?.updateInputs?.(data);
				break;
			case "--debug-switch-role":
				const player = this.#players.get(conn.id);
				if (!player) {
					return;
				}
				if (!data.keepBody) {
					this.addToDeleteQueue(player.entity.id);
				}
				const newEntity = new (player.entity instanceof BossEntity ? HeroEntity : BossEntity)(
					this,
					[20, -1, 20],
					[
						{
							modelId: playerModels[Math.floor(Math.random() * playerModels.length)],
							offset: [0, player.entity instanceof BossEntity ? -1.5 : -0.75, 0],
							scale: player.entity instanceof BossEntity ? 0.4 : 0.2,
						},
					],
				);
				this.addToCreateQueue(newEntity);
				player.entity = newEntity;
				conn.send({
					type: "camera-lock",
					entityId: player.entity.id,
					pov: "first-person", // player.entity instanceof BossEntity ? "top-down" : "first-person",
				});
				break;
			default:
				console.warn(`Unhandled message '${data["type"]}'`);
		}
	}

	#nextTick() {
		this.#world.nextTick();
		for (let input of this.#createdInputs) {
			input.serverTick();
		}

		if (this.#toCreateQueue.length > 0 || this.#toDeleteQueue.length > 0) {
			this.clearEntityQueues();
		}
	}

	addToCreateQueue(entity: Entity) {
		this.#toCreateQueue.push(entity);
	}

	/**
	 * This is a string at the moment, but can be changed into not that!
	 * @param sussyAndRemovable
	 */
	addToDeleteQueue(sussyAndRemovable: number) {
		this.#toDeleteQueue.push(sussyAndRemovable);
	}

	clearEntityQueues() {
		for (let i = 0; i < this.#toCreateQueue.length; i++) {
			let entity = this.#toCreateQueue.pop();

			if (entity) {
				this.#entities.set(entity.id, entity);
				this.#bodyToEntityMap.set(entity.body, entity);
				entity.addToWorld(this.#world);
			} else {
				console.log("Someone added a fake ass object to the creation queue");
			}
		}

		for (let i = 0; i < this.#toDeleteQueue.length; i++) {
			let entityName = this.#toDeleteQueue.pop();

			if (entityName) {
				let entity = this.#entities.get(entityName);

				console.log(entityName);

				if (entity) {
					this.#bodyToEntityMap.delete(entity.body);
					this.#entities.delete(entity.id);
					entity.removeFromWorld(this.#world);
				} else {
					console.log("Bug Detected! Tried to delete an entity that didn't exist");
				}
			} else {
				console.log("what have you done. you sent in a fake ass name");
			}
		}
	}

	serialize(): SerializedEntity[] {
		let serial: SerializedEntity[] = [];

		for (let [id, entity] of this.#entities.entries()) {
			serial.push(entity.serialize());
		}

		return serial;
	}

	serializePhysicsBodies(): SerializedBody[] {
		return this.#world.serialize();
	}
}
