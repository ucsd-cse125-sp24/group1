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

const startingStationLocations: Vector3[] = [
	[18, 0, 18],
	[-18, 6, -18],
	[12, 0, 18],
	[5, 0, 18],
	[-24, 0, 18],
	[21, 0, -11],
	[0, 0, -20],
];

const startingToolLocations: Vector3[] = [
	[-3, 0, -9],
	[-20, 0, -1],
	[-3, 0, 17],
	[20, 0, 1],
];

interface NetworkedPlayer {
	input: PlayerInput;
	entity: PlayerEntity;
	id: string;
	conn: Connection<ServerMessage>;
}

export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	#world = new PhysicsWorld({ gravity: [0, -60, 0] });
	#server;

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

		this.#server = new WsServer(this);
		this.#server.listen(2345);
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
	 * IMPORTANT: `Ray.intersectWorld` does NOT return the closest object. Do not
	 * use it.
	 *
	 * @param exclude - Use to prevent players from including themselves in the
	 * raycast.
	 */
	raycast(start: phys.Vec3, end: phys.Vec3, rayOptions: phys.RayOptions, exclude?: Entity): Entity[] {
		const entities = this.#world
			.castRay(start, end, rayOptions)
			.sort((a, b) => a.distance - b.distance)
			.flatMap(({ body }) => {
				const entity = body && this.#bodyToEntityMap.get(body);
				return entity && entity !== exclude ? [entity] : [];
			});
		return Array.from(new Set(entities));
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

		let posIndex = Math.floor(Math.random() * 4);
		let axe = new Item(this, "axe", startingToolLocations[posIndex], [{ modelId: "axe", scale: 0.75 }], "tool");
		this.#registerEntity(axe);

		posIndex == 3 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let pick = new Item(
			this,
			"pickaxe",
			startingToolLocations[posIndex],
			[{ modelId: "pickaxe", scale: 0.75 }],
			"tool",
		);
		this.#registerEntity(pick);

		posIndex == 3 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let shears = new Item(
			this,
			"shears",
			startingToolLocations[posIndex],
			[{ modelId: "shears", scale: 0.75 }],
			"tool",
		);
		this.#registerEntity(shears);

		posIndex = Math.floor(Math.random() * 7);
		console.log(posIndex);
		let Furnace = new CraftingTable(
			this,
			startingStationLocations[posIndex],
			[{ modelId: "fish1", scale: 7 }],
			[
				{ ingredients: ["raw_iron", "wood"], output: "iron" },
				{ ingredients: ["mushroom", "mushroom", "mushroom"], output: "magic_sauce" },
			],
		);
		this.#registerEntity(Furnace);

		posIndex == 6 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let WeaponCrafter = new CraftingTable(
			this,
			startingStationLocations[posIndex],
			[{ modelId: "fish1", scale: 7 }],
			[
				{ ingredients: ["iron", "iron", "wood"], output: "sword" },
				{ ingredients: ["iron", "wood"], output: "knife" },
				{ ingredients: ["iron", "iron", "string", "string"], output: "mushroom" }, //ARMOR
				{ ingredients: ["sword", "magic_sauce", "magic_sauce"], output: "gamer_sword" },
				{ ingredients: ["mushroom", "magic_sauce", "magic_sauce"], output: "magic_sauce" }, //GAMER_ARMOR
			],
		);
		this.#registerEntity(WeaponCrafter);

		posIndex == 6 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let FletchingTable = new CraftingTable(
			this,
			startingStationLocations[posIndex],
			[{ modelId: "fish1", scale: 7 }],
			[
				{ ingredients: ["wood", "wood", "string", "string"], output: "bow" },
				{ ingredients: ["bow", "magic_sauce"], output: "gamer_bow" },
				//probably should add arrows for when we get actual combat ngl
			],
		);
		this.#registerEntity(FletchingTable);

		posIndex == 6 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let woodSpawner = new Spawner(this, startingStationLocations[posIndex], "wood", "axe", [
			{ modelId: "wood", scale: 1.5 },
		]);
		this.#registerEntity(woodSpawner);

		posIndex == 6 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let oreSpawner = new Spawner(this, startingStationLocations[posIndex], "raw_iron", "pickaxe", [
			{ modelId: "raw_iron", scale: 1.5 },
		]);
		this.#registerEntity(oreSpawner);

		posIndex == 6 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let stringSpawner = new Spawner(this, startingStationLocations[posIndex], "string", "shears", [
			{ modelId: "string", scale: 1.5 },
		]);
		this.#registerEntity(stringSpawner);

		posIndex == 6 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let mushroomSpawner = new Spawner(this, startingStationLocations[posIndex], "mushroom", "knife", [
			{ modelId: "mushroom", scale: 1.5 },
		]);
		this.#registerEntity(mushroomSpawner);
	}

	playSound(sound: SoundId, position: phys.Vec3 | Vector3): void {
		if (position instanceof phys.Vec3) {
			position = position.toArray();
		}
		this.#server.broadcast({ type: "sound", sound, position });
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
				console.log(player.entity.getPos()); //FOR TESTING
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
			this.playSound("spore", target.entity.getPos());
		}
	}

	placeTrap(position: phys.Vec3) {
		this.#registerEntity(new TrapEntity(this, position));
		this.playSound("trapPlace", position);
	}

	trapHero(id: EntityId, position: phys.Vec3) {
		const target = this.#entities.get(id) as HeroEntity;
		target.isTrapped = true;
		target.body.position = position;
		this.playSound("trapTriggered", position);
	}

	freeHero(heroId: EntityId, trapId: EntityId) {
		const hero = this.#entities.get(heroId) as HeroEntity;
		hero.isTrapped = false;
		this.addToDeleteQueue(trapId);
		this.playSound("trapEscape", hero.getPos());
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

	broadcastState() {
		this.#server.broadcast({
			type: "entire-game-state",
			entities: this.serialize(),
			physicsBodies: this.serializePhysicsBodies(),
		});
	}

	logTicks(ticks: number, totalDelta: number) {
		log(
			`${ticks} ticks sampled. Average simulation time: ${(totalDelta / ticks).toFixed(4)}ms per tick. ${this.#server._debugGetConnectionCount()} connection(s), ${this.#server._debugGetActivePlayerCount()} of ${this.#server._debugGetPlayerCount()} player(s) online`,
		);
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
