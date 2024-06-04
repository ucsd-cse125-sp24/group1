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
import {
	Attack,
	ChangeRole,
	ClientMessage,
	GameStage,
	PlayerEntry,
	SerializedEntity,
	ServerMessage,
	Use,
} from "../common/messages";
import { MovementInfo, Vector3 } from "../common/commontypes";
import { sampleMapColliders } from "../assets/models/sample-map-colliders/server-mesh";
import { SoundId } from "../assets/sounds";
import { CameraEntity } from "../server/entities/CameraEntity";
import { PlayerInput } from "./net/PlayerInput";
import { PlayerEntity } from "./entities/PlayerEntity";
import { BossEntity } from "./entities/BossEntity";
import { Entity, EntityId } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { Connection, Server, ServerHandlers } from "./net/Server";
import { HeroEntity } from "./entities/HeroEntity";
import { getColliders } from "./entities/map/colliders";
import { MapEntity } from "./entities/map/MapEntity";
import { Item, ItemType } from "./entities/Interactable/Item";
import { CraftingTable } from "./entities/Interactable/CraftingTable";
import { log } from "./net/_tempDebugLog";
import { PhysicsWorld } from "./PhysicsWorld";
import { Spawner } from "./entities/Interactable/Spawner";
import { TrapEntity } from "./entities/Interactable/TrapEntity";
import { WebWorker } from "./net/WebWorker";
import { ArrowEntity } from "./entities/ArrowEntity";

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

/** Length of the crafting stage in milliseconds */
const CRAFT_STAGE_LENGTH = 60 * 1000 * 5; // 1 minute
/** Length of the combat stage in milliseconds */
const COMBAT_STAGE_LENGTH = 60 * 1000; // 0.5 minutes

const startingToolLocations: Vector3[] = [
	[-3, 0, -9],
	[-20, 0, -1],
	[-3, 0, 17],
	[20, 0, 1],
];

const CRAFTING_STAGE_TIME = 30 * 1000;
const COMBAT_STAGE_TIME = 120 * 1000;

interface NetworkedPlayer {
	input: PlayerInput;
	/** `null` if spectating */
	entity: PlayerEntity | null;
	useAction?: Use;
	attackAction?: Attack;
	online: boolean;
	id: string;
	conn: Connection<ServerMessage>;
	name: string;
}

export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	#world = new PhysicsWorld({ gravity: [0, -60, 0] });
	#server: Server<ClientMessage, ServerMessage>;

	#players: Map<string, NetworkedPlayer>;
	#createdInputs: PlayerInput[];

	#entities: Map<EntityId, Entity>;
	#bodyToEntityMap: Map<Body, Entity>;

	//Tyler is creating this so like. Might need to change
	#toCreateQueue: Entity[];
	#toDeleteQueue: EntityId[];

	#currentTick: number;
	/**
	 * Treat this as a state machine:
	 * "lobby" -> "crafting" -> "combat"
	 */
	#currentStage: GameStage = {
		type: "lobby",
		previousWinner: null,
	};

	constructor() {
		this.#createdInputs = [];
		this.#players = new Map();
		this.#entities = new Map();
		this.#bodyToEntityMap = new Map();

		this.#toCreateQueue = [];
		this.#toDeleteQueue = [];

		this.#currentTick = 0;

		this.#makeLobby();

		this.#server = BROWSER ? new WebWorker(this) : new (require("./net/WsServer").WsServer)(this);
		this.#server.listen(2345);
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
	 * A function that sets up the game in the Lobby state
	 */
	async #makeLobby() {
		let camera = new CameraEntity(this, [1000, 1005, 1000], [0, -10, 0], "lobby-camera");
		this.#registerEntity(camera);
	}

	/**
	 * State transition from "lobby" to "crafting"
	 */
	async #startGame() {
		this.#currentStage = {
			type: "crafting",
			startTime: Date.now(),
			endTime: Date.now() + CRAFT_STAGE_LENGTH,
		};

		// Reset players
		for (const player of this.#players.values()) {
			if (player.entity) {
				player.entity.body.position = new phys.Vec3(0, -1, 0);
				player.entity.body.velocity = new phys.Vec3(0, 0, 0);
				player.entity.health = player.entity.initHealth;
				if (player.entity instanceof HeroEntity) {
					player.entity.isSabotaged = false;
					player.entity.isTrapped = false;
				}
			}
		}

		const mapColliders = getColliders(await sampleMapColliders);
		const mapEntity = new MapEntity(this, [0, -5, 0], mapColliders, [{ modelId: "map" }]);
		this.#registerEntity(mapEntity);

		let plane = new PlaneEntity(this, [0, -10, 0], [-1, 0, 0, 1], []);
		this.#registerEntity(plane);

		let posIndex = Math.floor(Math.random() * 4);
		let axe = new Item(this, "axe", startingToolLocations[posIndex], "tool");
		this.#registerEntity(axe);

		posIndex == 3 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let pick = new Item(this, "pickaxe", startingToolLocations[posIndex], "tool");
		this.#registerEntity(pick);

		posIndex == 3 ? (posIndex = 0) : posIndex++;
		console.log(posIndex);
		let shears = new Item(this, "shears", startingToolLocations[posIndex], "tool");
		this.#registerEntity(shears);

		let Furnace = new CraftingTable(
			this,
			[18, 0, 18],
			[{ modelId: "furnace", scale: 0.5, offset: [0, -1.5, 0] }],
			[
				{ ingredients: ["raw_iron", "wood"], output: "iron" },
				{ ingredients: ["mushroom", "mushroom", "mushroom"], output: "magic_sauce" },
			],
		);
		this.#registerEntity(Furnace);

		let WeaponCrafter = new CraftingTable(
			this,
			[-18, 6, -18],
			[{ modelId: "anvil", offset: [0, -1.25, 0] }],
			[
				{ ingredients: ["iron", "iron", "wood"], output: "sword" },
				{ ingredients: ["iron", "wood"], output: "knife" },
				{ ingredients: ["iron", "iron", "string", "string"], output: "armor" },
				{ ingredients: ["sword", "magic_sauce", "magic_sauce"], output: "gamer_sword" },
				{ ingredients: ["mushroom", "magic_sauce", "magic_sauce"], output: "armor" }, //GAMER ARMOR
			],
		);
		this.#registerEntity(WeaponCrafter);

		let FletchingTable = new CraftingTable(
			this,
			[12, 0, 18],
			[{ modelId: "work_station", offset: [0, -1.25, 0] }],
			[
				{ ingredients: ["wood", "wood", "string", "string"], output: "bow" },
				{ ingredients: ["bow", "magic_sauce"], output: "gamer_bow" },
				//probably should add arrows for when we get actual combat ngl
			],
		);
		this.#registerEntity(FletchingTable);

		let woodSpawner = new Spawner(this, [5, 0, 18], "wood", "axe", [{ modelId: "chair", offset: [0, -1.1, 0] }]);
		this.#registerEntity(woodSpawner);

		let oreSpawner = new Spawner(this, [-24, 0, 18], "raw_iron", "pickaxe", [
			{ modelId: "ore_vein", offset: [0, -1.1, 0] },
		]);
		this.#registerEntity(oreSpawner);

		let stringSpawner = new Spawner(this, [21, 0, -11], "string", "shears", [
			{ modelId: "spider_web", offset: [0, -1.1, 0] },
		]);
		this.#registerEntity(stringSpawner);

		let mushroomSpawner = new Spawner(this, [0, 0, -15], "mushroom", "knife", [
			{ modelId: "mushroom_cluster", offset: [0, -1.1, 0] },
		]);
		this.#registerEntity(mushroomSpawner);

		let sampleIorn = new Item(this, "knife", [5, 0, 5], "resource");
		this.#registerEntity(sampleIorn);

		let sampleIorn2 = new Item(this, "raw_iron", [7, 0, 5], "resource");
		this.#registerEntity(sampleIorn2);
	}

	// #region Gameplay Methods
	/**
	 * State transition from "crafting" to "combat"
	 */
	#transitionToCombat() {
		this.#currentStage = { type: "combat", startTime: Date.now(), endTime: Date.now() + COMBAT_STAGE_LENGTH };
	}

	/**
	 * Check whether either side has met their win condition
	 */
	#checkGameOver() {
		let isAnyHeroAlive = false;
		let isAnyBossAlive = false;
		for (const { entity } of this.#players.values()) {
			if (entity && entity.health > 0) {
				if (entity instanceof BossEntity) {
					isAnyBossAlive = true;
				} else if (entity instanceof HeroEntity) {
					isAnyHeroAlive = true;
				}
				if (isAnyBossAlive && isAnyHeroAlive) {
					break;
				}
			}
		}
		const endTime = this.#currentStage.type === "lobby" ? 0 : this.#currentStage.endTime;
		if (!isAnyBossAlive) {
			// Heroes win
			this.#server.broadcast({ type: "game-over", winner: "heroes" });
			this.#currentStage = { type: "lobby", previousWinner: "hero" };
		} else if (Date.now() >= endTime || !isAnyHeroAlive) {
			// Boss wins
			this.#server.broadcast({ type: "game-over", winner: "boss" });
			this.#currentStage = { type: "lobby", previousWinner: "boss" };
		} else {
			return;
		}
		for (const player of this.#players.values()) {
			// If player entity isn't in the world (because they died), add them back
			if (player.entity && !this.#entities.has(player.entity.id)) {
				this.addToCreateQueue(player.entity);
			}
		}
	}

	playSound(sound: SoundId, position: phys.Vec3 | Vector3): void {
		if (position instanceof phys.Vec3) {
			position = position.toArray();
		}
		this.#server.broadcast({ type: "sound", sound, position });
	}

	playParticle(position: phys.Vec3 | Vector3): void {
		if (position instanceof phys.Vec3) {
			position = position.toArray();
		}
		this.#server.broadcast({ type: "particle", position });
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

	shootArrow(position: phys.Vec3, velocity: phys.Vec3, damage: number) {
		this.#registerEntity(new ArrowEntity(this, position, velocity, damage));
	}
	// #endregion

	// #region Player management methods
	#getPlayerByEntityId(id: EntityId): NetworkedPlayer | undefined {
		for (const player of this.#players.values()) {
			if (player.entity?.id === id) {
				return player;
			}
		}
		return undefined;
	}

	#createPlayerEntity(pos: Vector3, { role, skin = "red" }: ChangeRole): PlayerEntity | null {
		switch (role) {
			case "hero":
				return new HeroEntity(this, pos, [
					{
						modelId: `player_${skin}`,
						offset: [0, -1.5, 0],
						scale: 0.4,
					},
				]);
			case "boss":
				return new BossEntity(this, pos, [
					{
						modelId: "samplePlayer",
						offset: [0, -0.75, 0],
						scale: 0.2,
					},
				]);
			default:
				return null;
		}
	}

	handlePlayerJoin(conn: Connection<ServerMessage>) {
		console.log("Player joining!", this.#players.size);
		let player = this.#players.get(conn.id);
		if (player) {
			player.conn = conn;
			player.online = true;
			if (player.entity) {
				conn.send({
					type: "camera-lock",
					entityId: player.entity.id,
					freeRotation: true,
					pov: "first-person", // player.entity instanceof BossEntity ? "top-down" : "first-person",
				});
			}
		} else {
			let input = new PlayerInput();
			this.#createdInputs.push(input);

			player = {
				id: conn.id,
				conn: conn,
				input: input,
				entity: null,
				online: true,
				name: `Player ${conn.id.slice(0, 6)}`,
			};
			this.#players.set(conn.id, player);
		}
		if (this.#currentStage.type === "lobby") {
			conn.send({
				type: "camera-lock",
				entityId: "lobby-camera",
				pov: "first-person",
				freeRotation: false,
			});
		}
	}

	handlePlayerDisconnect(id: string): void {
		const player = this.#players.get(id);
		if (player) {
			player.online = false;
		}
	}
	// #endregion

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
			case "change-name": {
				const player = this.#players.get(conn.id);
				if (!player) {
					return;
				}
				player.name = data.name;
				if (player.entity) {
					player.entity.displayName = data.name;
				}
				break;
			}
			case "change-role": {
				const player = this.#players.get(conn.id);
				if (!player) {
					return;
				}
				const oldEntity = player.entity;
				if (oldEntity) {
					this.addToDeleteQueue(oldEntity.id);
				}
				player.entity = this.#createPlayerEntity(oldEntity?.getPos() ?? [20, -1, 20], data);
				if (player.entity) {
					this.addToCreateQueue(player.entity);
					player.entity.displayName = player.name;
					conn.send({
						type: "camera-lock",
						entityId: player.entity.id,
						freeRotation: true,
						pov: "first-person", // player.entity instanceof BossEntity ? "top-down" : "first-person",
					});
				}
				break;
			}
			case "start-game": {
				if (this.#currentStage.type === "lobby") {
					this.#startGame();
				}
				break;
			}
			case "--debug-skip-stage": {
				switch (this.#currentStage.type) {
					case "lobby": {
						this.#startGame();
						break;
					}
					case "crafting": {
						this.#transitionToCombat();
						break;
					}
					case "combat": {
						this.#currentStage = { type: "lobby", previousWinner: null };
						break;
					}
				}
				break;
			}
			default:
				console.warn(`Unhandled message '${data["type"]}'`);
		}
	}

	// #region Game State Methods
	getCurrentTick = () => this.#currentTick;
	getCurrentStage = () => this.#currentStage;

	logTicks(ticks: number, totalDelta: number) {
		if ("_debugGetActivePlayerCount" in this.#server) {
			const server = this.#server as any;
			log(
				`${ticks} ticks sampled. Average simulation time: ${(totalDelta / ticks).toFixed(
					4,
				)}ms per tick. ${server._debugGetConnectionCount()} connection(s), ${server._debugGetActivePlayerCount()} of ${server._debugGetPlayerCount()} player(s) online`,
			);
		}
	}
	updateGameState() {
		for (let [id, player] of this.#players.entries()) {
			if (!player.entity) {
				continue;
			}
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
			let walkSoundIndex = player.entity.shouldPlayWalkingSound();
			if (walkSoundIndex > 0) {
				if (walkSoundIndex == 1) {
					this.playSound("walkLeft", player.entity.getPos());
				} else {
					this.playSound("walkRight", player.entity.getPos());
				}
			}

			const use = player.entity.use();
			player.useAction = use?.type;
			if (posedge.use) {
				if (use) {
					use.commit();
				} else {
					this.playSound("useFail", player.entity.getPos());
				}
			}
			const attack = player.entity.attack();
			player.attackAction = attack?.type;
			if (posedge.attack) {
				if (attack) {
					attack.commit();
				} else {
					this.playSound("attackFail", player.entity.getPos());
				}
				this.playParticle(player.entity.getPos());
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
						"resource",
					),
				);
				log(`Player ${player.id.slice(0, 6)} spawned ${modelId}`);
			}
		}
		this.#nextTick();
	}

	#nextTick() {
		this.#currentTick++;
		this.#world.nextTick();
		for (let input of this.#createdInputs) {
			input.serverTick();
		}
		for (let entity of this.#entities.values()) {
			entity.tick();
		}
		if (this.#toCreateQueue.length > 0 || this.#toDeleteQueue.length > 0) {
			this.clearEntityQueues();
		}

		switch (this.#currentStage.type) {
			case "crafting": {
				if (Date.now() >= this.#currentStage.endTime) {
					this.#transitionToCombat();
				}
				break;
			}
			case "combat": {
				this.#checkGameOver();
				break;
			}
		}
	}

	#serializeNetworkedPlayer(player: NetworkedPlayer): PlayerEntry {
		return {
			name: player.name,
			role: !player.entity ? "spectator" : player.entity instanceof BossEntity ? "boss" : "hero",
			entityId: player.entity?.id,
			useAction: player.useAction,
			attackAction: player.attackAction,
			online: player.online,
			health: player.entity?.health,
		};
	}

	broadcastState() {
		for (const player of this.#players.values()) {
			player.conn.send({
				type: "entire-game-state",
				stage: this.#currentStage,
				entities: Object.fromEntries(Array.from(this.#entities.entries(), ([id, entity]) => [id, entity.serialize()])),
				physicsBodies: this.#world.serialize(),
				others: Array.from(this.#players.values(), (p) =>
					p === player ? [] : [this.#serializeNetworkedPlayer(p)],
				).flat(),
				me: this.#serializeNetworkedPlayer(player),
			});
		}
	}
	// #endregion

	// #region Entity Management Methods
	addToDeleteQueue(sussyAndRemovable: EntityId) {
		const index = this.#toCreateQueue.findIndex((entity) => entity.id === sussyAndRemovable);
		if (index !== -1) {
			this.#toCreateQueue.splice(index, 1);
			return;
		}

		this.#toDeleteQueue.push(sussyAndRemovable);
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
	// #endregion

	reset() {
		this.#currentStage = {
			type: "lobby",
			previousWinner: null,
		};
		for (let entity of [...this.#entities.values()]) {
			this.#unregisterEntity(entity);
		}

		this.#world.removeAllBodies();

		// Set up new game
		this.#makeLobby();
		for (let player of this.#players.values()) {
			player.conn.send({
				type: "camera-lock",
				entityId: "lobby-camera",
				pov: "first-person",
				freeRotation: false,
			});
			player.entity = null;
		}
	}
}

/**
 * Whether the server is being compiled for the browser. This is set by the
 * `esbuild` bundle options in `package.json`.
 */
declare var BROWSER: boolean;
