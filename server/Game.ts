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
import { MovementInfo, Vector3 } from "../common/commontypes";
import { sampleMapColliders } from "../assets/models/sample-map-colliders/server-mesh";
import { ModelId } from "../assets/models";
import { SoundId } from "../assets/sounds";
import { PlayerInput } from "./net/PlayerInput";
import { PlayerEntity } from "./entities/PlayerEntity";
import { BossEntity } from "./entities/BossEntity";
import { Entity, EntityId } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { Connection, ServerHandlers } from "./net/Server";
import { HeroEntity } from "./entities/HeroEntity";
import { getColliders } from "./entities/map/colliders";
import { MapEntity } from "./entities/map/MapEntity";
import { Item, ItemType } from "./entities/Interactable/Item";
import { CraftingTable } from "./entities/Interactable/CraftingTable";
import { log } from "./net/_tempDebugLog";
import { PhysicsWorld } from "./PhysicsWorld";
import { WsServer } from "./net/WsServer";
import { Spawner } from "./entities/Interactable/Spawner";
import { TrapEntity } from "./entities/Interactable/TrapEntity";

// TEMP? (used for randomization)
const playerModels: ModelId[] = ["samplePlayer", "player_blue", "player_green", "player_red", "player_yellow"];
// Note: this only works because ItemType happens to be a subset of ModelId
const itemModels: ItemType[] = [
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
	server = new WsServer(this);

	#players: Map<string, NetworkedPlayer>;
	#createdInputs: PlayerInput[];

	#entities: Map<EntityId, Entity>;
	#bodyToEntityMap: Map<Body, Entity>;

	//Tyler is creating this so like. Might need to change
	#toCreateQueue: Entity[];
	#toDeleteQueue: EntityId[];

	#currentTick: number;
	constructor() {
		this.#createdInputs = [];
		this.#players = new Map();
		this.#entities = new Map();
		this.#bodyToEntityMap = new Map();

		this.#toCreateQueue = [];
		this.#toDeleteQueue = [];

		this.#currentTick = 0;
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

		let bigIron = new Item(this, "raw_iron", 0.5, [18, 0, 15], [{ modelId: "raw_iron", scale: 0.5 }], "resource");
		this.#registerEntity(bigIron);

		let smallIron = new Item(this, "raw_iron", 0.5, [18, 0, 13], [{ modelId: "raw_iron", scale: 0.5 }], "resource");
		this.#registerEntity(smallIron);

		let string = new Item(this, "string", 0.5, [17, 0, 15], [{ modelId: "string", scale: 0.5 }], "resource");
		this.#registerEntity(string);

		let axe = new Item(this, "axe", 0.5, [15, 0, 15], [{ modelId: "axe", scale: 0.75 }], "tool");
		this.#registerEntity(axe);

		let tempCrafter = new CraftingTable(
			this,
			[18, 0, 18],
			[{ modelId: "fish1", scale: 7 }],
			[
				{ ingredients: ["raw_iron", "raw_iron"], output: "iron" },
				{ ingredients: ["wood", "string"], output: "pickaxe" },
			],
		);
		this.#registerEntity(tempCrafter);

		let woodSpawner = new Spawner(this, [-18, 6, -18], "wood", "axe", [{ modelId: "fish1", scale: 7 }]);
		this.#registerEntity(woodSpawner);

		let oreSpawner = new Spawner(this, [18, 6, -18], "raw_iron", "pickaxe", [{ modelId: "raw_iron", scale: 3 }]);
		this.#registerEntity(oreSpawner);
	}

	playSound(sound: SoundId, position: phys.Vec3 | Vector3): void {
		if (position instanceof phys.Vec3) {
			position = position.toArray();
		}
		this.server.broadcast({ type: "sound", sound, position });
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
				const used = player.entity.use();
				if (!used) {
					this.playSound("useFail", player.entity.getPos());
				}
			}
			if (posedge.attack) {
				const attacked = player.entity.attack();
				if (!attacked) {
					this.playSound("attackFail", player.entity.getPos());
				}
			}
			if (posedge.emote) {
				// TEMP: using `emote` key (X) to spawn item above player
				const modelId = itemModels[Math.floor(Math.random() * itemModels.length)];
				this.addToCreateQueue(
					// TODO: other parameters?
					new Item(
						this,
						modelId,
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

	placeTrap(position: phys.Vec3) {
		this.#registerEntity(new TrapEntity(this, position));
	}

	trapHero(id: EntityId, position: phys.Vec3) {
		const target = this.#entities.get(id) as HeroEntity;
		target.isTrapped = true;
		target.body.position = position;
	}

	freeHero(heroId: EntityId, trapId: EntityId) {
		const hero = this.#entities.get(heroId) as HeroEntity;
		hero.isTrapped = false;
		this.addToDeleteQueue(trapId);
	}

	#getPlayerByEntityId(id: EntityId): NetworkedPlayer | undefined {
		for (const player of this.#players.values()) {
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
		this.#currentTick++;
		this.#world.nextTick();
		for (let input of this.#createdInputs) {
			input.serverTick();
		}

		if (this.#toCreateQueue.length > 0 || this.#toDeleteQueue.length > 0) {
			this.clearEntityQueues();
		}
	}

	getCurrentTick() {
		return this.#currentTick;
	}

	addToCreateQueue(entity: Entity) {
		// If entity was in delete queue, remove it from there instead (can happen
		// if an entity is deleted then re-added in the same tick)
		const index = this.#toDeleteQueue.indexOf(entity.id);
		if (index !== -1) {
			this.#toDeleteQueue.splice(index, 1);
			return;
		}

		this.#toCreateQueue.push(entity);
	}

	/**
	 * @param sussyAndRemovable
	 */
	addToDeleteQueue(sussyAndRemovable: EntityId) {
		const index = this.#toCreateQueue.findIndex((entity) => entity.id === sussyAndRemovable);
		if (index !== -1) {
			this.#toCreateQueue.splice(index, 1);
			return;
		}

		this.#toDeleteQueue.push(sussyAndRemovable);
	}

	clearEntityQueues() {
		for (const entity of this.#toCreateQueue) {
			this.#entities.set(entity.id, entity);
			this.#bodyToEntityMap.set(entity.body, entity);
			entity.addToWorld(this.#world);
		}
		this.#toCreateQueue = [];

		for (const entityId of this.#toDeleteQueue) {
			let entity = this.#entities.get(entityId);

			console.log("delete", entityId);

			if (entity) {
				this.#bodyToEntityMap.delete(entity.body);
				this.#entities.delete(entity.id);
				entity.removeFromWorld(this.#world);
			} else {
				console.log("Bug Detected! Tried to delete an entity that didn't exist");
			}
		}
		this.#toDeleteQueue = [];
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
