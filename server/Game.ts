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
	Action,
	Attack,
	ChangeRole,
	ClientMessage,
	EntityModel,
	GameStage,
	ParticleOptions,
	PlayerEntry,
	ServerMessage,
	Use,
} from "../common/messages";
import { MovementInfo, Vector3 } from "../common/commontypes";
import { mapColliders } from "../assets/models/map-colliders/server-mesh";
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
import { BigBossEntity } from "./entities/BigBossEntity";
import { StaticLightEntity } from "./entities/StaticLightEntity";
import { StaticCubeEntity } from "./entities/StaticCubeEntity";
import { MinecartEntity } from "./entities/MinecartEntity";
import { StaticEntity } from "./entities/StaticEntity";
import { GroundMaterial } from "./materials/SourceMaterials";

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
/** Spawn locations of the boss */
const SPAWN_LOCATION = [
	[17, -4.17, 13.78],
	[5.45, -4.17, 29.58],
	[-19.52, -4.17, 18.27],
	[-7.65, -18.42, -23.25],
	[-3.13, -18.42, 6.05],
	[5.21, -18.42, 4.72],
	[-1.95, -18.42, 5.92],
];

/** Length of the crafting stage in milliseconds */
const CRAFT_STAGE_LENGTH = 60 * 1000 * 6; // 5 minute
/** Length of the combat stage in milliseconds */
const COMBAT_STAGE_LENGTH = 60 * 1000 * 1.5; // 2 minutes

const startingToolLocations: Vector3[] = [
	[-3, 0, -9],
	[-20, 0, -1],
	[-3, 0, 17],
	[20, 0, 1],
];

const CRAFTING_STAGE_TIME = 30 * 1000;
const COMBAT_STAGE_TIME = 120 * 1000;

type EntityRayCastResult = {
	entity: Entity;
	point: phys.Vec3;
	distance: number;
};

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
	debug: boolean;
}

export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	#world = new PhysicsWorld({ gravity: [0, -60, 0] });
	#server: Server<ClientMessage, ServerMessage>;

	#players: Map<string, NetworkedPlayer>;
	#createdInputs: PlayerInput[];

	#entities: Map<EntityId, Entity>;
	#bodyToEntityMap: Map<Body, Entity>;

	#toCreateQueue: Entity[];
	#toDeleteQueue: EntityId[];

	#currentTick: number;

	#bossResets: Map<BossEntity, number>;
	#minecart: MinecartEntity | null;
	#obstacles: StaticEntity[];
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
		this.#bossResets = new Map();

		this.#minecart = null;
		this.#obstacles = [];

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
	raycast(start: phys.Vec3, end: phys.Vec3, rayOptions: phys.RayOptions, exclude?: Entity): EntityRayCastResult[] {
		const entities: Record<EntityId, EntityRayCastResult> = {};
		for (const result of this.#world.castRay(start, end, rayOptions)) {
			const entity = result.body && this.#bodyToEntityMap.get(result.body);
			if (!entity || entity === exclude) {
				continue;
			}
			if (!entities[entity.id] || result.distance < entities[entity.id].distance) {
				entities[entity.id] = {
					entity,
					point: result.hitPointWorld,
					distance: result.distance,
				};
			}
		}
		return Object.values(entities).sort((a, b) => a.distance - b.distance);
	}

	/**
	 * A function that sets up the game in the Lobby state
	 */
	async #makeLobby() {
		let camera = new CameraEntity(this, [0, 115, 0], [-20, 90, 0], "lobby-camera");
		this.#registerEntity(camera);

		let lobbyFloor = new phys.Body({
			mass: 0,
			position: new phys.Vec3(0, 100, 0),
			shape: new phys.Box(new phys.Vec3(...[20, 10, 20])),
			type: phys.Body.STATIC,
		});

		this.#world.addBody(lobbyFloor);
	}

	// #region startGame
	/**
	 * State transition from "lobby" to "crafting"
	 */
	async #startGame() {
		// this.#reset();
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
				player.entity.reset();
				player.conn.send({
					type: "camera-lock",
					entityId: player.entity.id,
					freeRotation: true,
					pov: "first-person",
				});
			}
		}

		const colliders = getColliders(await mapColliders);
		const mapEntity = new MapEntity(this, [0, -5, 0], colliders, [{ modelId: "map" }]);
		this.#registerEntity(mapEntity);

		let plane = new PlaneEntity(this, [0, -20, 0], [-1, 0, 0, 1], []);
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

		let fullSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI);
		let halfSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI / 2);
		let quarterSquat = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), Math.PI / 4);

		let Furnace = new CraftingTable(
			this,
			[-17.7, -3.5, -24],
			"furnace",
			[
				{ ingredients: ["raw_iron", "wood"], output: "iron" },
				{ ingredients: ["mushroom", "mushroom"], output: "magic_sauce" },
			],
			new phys.Vec3(0, 0, 1),
		);
		Furnace.body.quaternion = new phys.Quaternion().setFromAxisAngle(phys.Vec3.UNIT_Y, -Math.PI / 2);

		this.#registerEntity(Furnace);

		let WeaponCrafter = new CraftingTable(this, [12, -3.5, 28], "weapons", [
			{ ingredients: ["iron", "iron", "wood"], output: "sword" },
			{ ingredients: ["iron", "wood"], output: "knife" },
		]);
		this.#registerEntity(WeaponCrafter);

		// TEMP: for testing crafter
		for (let i = 0; i < 5; i++) {
			this.#registerEntity(new Item(this, "wood", [10, -3, 20], "resource"));
			this.#registerEntity(new Item(this, "iron", [10, -3, 20], "resource"));
		}

		let FletchingTable = new CraftingTable(this, [-15, -3.9, 26], "fletching", [
			{ ingredients: ["wood", "wood", "string", "string"], output: "bow" },
			{ ingredients: ["iron", "iron", "string", "string"], output: "armor" },
			//probably should add arrows for when we get actual combat ngl
		]);
		FletchingTable.body.quaternion = quarterSquat;
		this.#registerEntity(FletchingTable);

		let SauceTable = new CraftingTable(
			this,
			[12.5, -4, 10],
			"magic_table",
			[
				{ ingredients: ["armor", "magic_sauce"], output: "gamer_armor" },
				{ ingredients: ["bow", "magic_sauce", "magic_sauce"], output: "gamer_bow" },
				{ ingredients: ["sword", "magic_sauce", "magic_sauce"], output: "gamer_sword" },
				//probably should add arrows for when we get actual combat ngl
			],
			new phys.Vec3(0, 0, 1),
		);
		SauceTable.body.quaternion = halfSquat;
		this.#registerEntity(SauceTable);

		let woodSpawner = new Spawner(this, [-5, -4.8, -24], "wood", "wood", "axe");
		woodSpawner.body.quaternion = new phys.Quaternion().setFromAxisAngle(new phys.Vec3(0, 1, 0), (3 * Math.PI) / 4);
		this.#registerEntity(woodSpawner);

		let woodSpawner2 = new Spawner(this, [-7, -3.7, -27], "wood2", "wood", "axe");
		woodSpawner2.body.quaternion = halfSquat;
		this.#registerEntity(woodSpawner2);

		let oreSpawner = new Spawner(this, [0, -17.65, -21.5], "iron", "raw_iron", "pickaxe");
		this.#registerEntity(oreSpawner);

		let oreSpawner2 = new Spawner(this, [10, -17.65, 21], "iron", "raw_iron", "pickaxe");
		this.#registerEntity(oreSpawner2);

		let stringSpawner = new Spawner(this, [-14.5, -17.5, -20.75], "string", "string", "shears");
		stringSpawner.body.quaternion = halfSquat.mult(fullSquat);
		this.#registerEntity(stringSpawner);

		let mushroomSpawner = new Spawner(this, [-18, -19.05, 4], "mushroom", "mushroom", "knife");
		this.#registerEntity(mushroomSpawner);

		let mushroomSpawner2 = new Spawner(this, [-1, -19.05, 10.5], "mushroom", "mushroom", "knife");
		this.#registerEntity(mushroomSpawner2);

		let sampleIorn = new Item(this, "knife", [5, 0, 5], "resource");
		this.#registerEntity(sampleIorn);

		let sampleIorn2 = new Item(this, "armor", [7, 0, 5], "resource");
		this.#registerEntity(sampleIorn2);

		this.#minecart = null;
		this.#obstacles = [];
		this.#obstacles.push(
			new StaticEntity(this, [-27, 0, 0], new phys.Box(new phys.Vec3(2, 10, 5)), GroundMaterial, [
				{ modelId: "rockpile", offset: [0, -5, 0] },
			]),
			new StaticEntity(this, [16, 0, 0], new phys.Box(new phys.Vec3(2, 10, 5)), GroundMaterial, [
				{ modelId: "rockpile", offset: [0, -5, 0], rotation: [0, 1, 0, 0] },
			]),
		);
		for (const entity of this.#obstacles) {
			this.#registerEntity(entity);
		}

		const hueLightCount = 9;
		for (let i = 0; i < hueLightCount; i++) {
			const radius = 5 + Math.random() * 15;
			this.#registerEntity(
				new StaticLightEntity(
					this,
					[
						Math.cos((i / hueLightCount) * 2 * Math.PI) * radius,
						Math.random() * 40 - 20,
						Math.sin((i / hueLightCount) * 2 * Math.PI) * radius,
					],
					{
						color: [i / hueLightCount, Math.random(), Math.exp(Math.random() * 4 - 1)],
						falloff: Math.random() * 10 + 0.1,
					},
				),
			);
		}

		// Debug room
		this.#registerEntity(
			new StaticLightEntity(this, [0, 70, 0], {
				color: [202 / 360, 0.1, 2],
				falloff: 10,
			}),
		);
		this.#registerEntity(
			new StaticCubeEntity(this, [0, 50, 0], [20, 4, 20], [{ modelId: "defaultCube", scale: [20, 4, 20] }]),
		);
		const debugItemEntities = [
			...(
				[
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
					"armor",
					"wood",
					"gamer_armor",
				] as const
			).map((item) => new Item(this, item, [0, 0, 0], "resource")),
		];
		for (const [i, entity] of debugItemEntities.entries()) {
			entity.body.position = new phys.Vec3(
				Math.cos((i / debugItemEntities.length) * 2 * Math.PI) * 5,
				55,
				Math.sin((i / debugItemEntities.length) * 2 * Math.PI) * 5,
			);
			this.#registerEntity(entity);
		}
		const debugSpawnerEntities = [
			...(["string", "iron", "mushroom", "wood", "wood2"] as const).map(
				(type) => new Spawner(this, [0, 0, 0], type, "wood", "wood"),
			),
			...(["furnace", "weapons", "fletching", "magic_table"] as const).map(
				(type) => new CraftingTable(this, [0, 0, 0], type, []),
			),
		];
		for (const [i, entity] of debugSpawnerEntities.entries()) {
			entity.body.position = new phys.Vec3(
				Math.cos((i / debugSpawnerEntities.length) * 2 * Math.PI) * 10,
				56,
				Math.sin((i / debugSpawnerEntities.length) * 2 * Math.PI) * 10,
			);
			this.#registerEntity(entity);
		}
		this.#registerEntity(
			new StaticEntity(this, [0, 70, 0], undefined, GroundMaterial, [{ image: "testTexture", height: 4 }]),
		);
	}
	// #endregion

	// #region Gameplay
	/**
	 * State transition from "crafting" to "combat"
	 */
	#transitionToCombat() {
		this.#currentStage = { type: "combat", startTime: Date.now(), endTime: Date.now() + COMBAT_STAGE_LENGTH };

		for (const player of this.#players.values()) {
			const oldBoss = player.entity;
			if (!(oldBoss instanceof BossEntity)) {
				continue;
			}
			this.addToDeleteQueue(oldBoss.id);
			player.entity = new BigBossEntity(this, [23, 0, 0]); //send them to the spawn area
			player.entity.reset();
			this.addToCreateQueue(player.entity);
			player.conn.send({
				type: "camera-lock",
				entityId: player.entity.id,
				freeRotation: true,
				pov: "first-person",
			});
		}

		this.#minecart = new MinecartEntity(this, new phys.Vec3(-72, -2, 2));
		this.addToCreateQueue(this.#minecart);
		for (const entity of this.#obstacles) {
			this.addToDeleteQueue(entity.id);
		}
	}

	/**
	 * Check whether either side has met their win condition
	 */
	#checkGameOver() {
		let isAnyHeroAlive = true;
		let isAnyBossAlive = false;
		for (const { entity } of this.#players.values()) {
			if (entity && entity.health > 0) {
				if (entity.isBoss) {
					isAnyBossAlive = true;
				} else {
					isAnyHeroAlive = true;
				}
				if (isAnyBossAlive && isAnyHeroAlive) {
					break;
				}
			}
		}
		const endTime = this.#currentStage.type === "lobby" ? Number.POSITIVE_INFINITY : this.#currentStage.endTime;
		if (!isAnyBossAlive || Date.now() >= endTime) {
			// Heroes win
			this.#server.broadcast({ type: "game-over", winner: "heroes" });
			this.#currentStage = { type: "lobby", previousWinner: "hero" };
		} else if (!isAnyHeroAlive || (this.#minecart && this.#minecart.health <= 0)) {
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

	playParticle(options: Partial<ParticleOptions> = {}): void {
		this.#server.broadcast({ type: "particle", options });
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

	shootArrow(position: phys.Vec3, velocity: phys.Vec3, damage: number, mod: EntityModel[]) {
		this.#registerEntity(new ArrowEntity(this, position, velocity, damage, mod));
	}

	teleportBoss(boss: BossEntity) {
		let randNum = Math.floor(Math.random() * 10) % 7;
		boss.resetSpeed();
		boss.body.position = new phys.Vec3(
			SPAWN_LOCATION[randNum][0],
			SPAWN_LOCATION[randNum][1],
			SPAWN_LOCATION[randNum][2],
		);
	}

	playerHitBoss(boss: BossEntity) {
		if (!this.#bossResets.has(boss)) {
			boss.setSpeed(0);
			this.#bossResets.set(boss, 150);
		}
	}
	// #endregion

	// #region Player
	#getPlayerByEntityId(id: EntityId): NetworkedPlayer | undefined {
		for (const player of this.#players.values()) {
			if (player.entity?.id === id) {
				return player;
			}
		}
		return undefined;
	}

	playDamageFilter(id: EntityId): void {
		this.#getPlayerByEntityId(id)?.conn.send({ type: "damage" });
	}

	#createPlayerEntity(playerNum: number, pos: Vector3, { role, skin = "red" }: ChangeRole): PlayerEntity | null {
		console.log(playerNum);
		if (this.#currentStage.type === "lobby") {
			pos = [(2 * playerNum - 6) % 12, 115, -5];
			if (playerNum === 0) {
				for (let i = 1; i < 5; i++) {
					this.#createPlayerEntity(i, pos, { type: "change-role", role, skin });
				}
			}
		}
		let entity;
		switch (role) {
			case "hero":
				entity = new HeroEntity(this, pos, [
					{
						modelId: `player_${skin}`,
						offset: [0, -1.5, 0],
						scale: 0.4,
					},
				]);
				break;
			case "boss":
				entity = new BossEntity(this, [pos[0], pos[1] + 2, pos[2]]);
				break;
			default:
				return null;
		}
		entity.reset();
		return entity;
	}

	handlePlayerJoin(conn: Connection<ServerMessage>, name = `Player ${conn.id.slice(0, 6)}`) {
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
				name,
				debug: false,
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

	playerEquipArmor(entity: Item, player: PlayerEntity): Action<Use> | null {
		if (this.getCurrentStage().type == "combat" && player instanceof HeroEntity) {
			if (entity.type == "armor" || entity.type == "gamer_armor") {
				this.addToDeleteQueue(entity.id);

				player.health += entity.type == "armor" ? 3 : 6;
				player.addArmorModel(entity.type);

				return {
					type: "equip-armor",
					commit: () => {
						this.playSound("pickup", player.getPos());
					},
				};
			} else {
				console.log("SHOULD NOT BE HERE");
				return null;
			}
		}
		return null;
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
					time: Date.now(),
				});
				break;
			case "pong":
				conn.send({
					type: "ping",
					time: Date.now(),
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
				if (!player) return;

				const oldEntity = player.entity;
				if (oldEntity) {
					this.addToDeleteQueue(oldEntity.id);
				}

				player.entity = this.#createPlayerEntity(
					this.#createdInputs.indexOf(player.input),
					oldEntity?.getFootPos() ?? [0, 0, 0],
					data,
				);

				if (player.entity) {
					this.addToCreateQueue(player.entity);
					player.entity.displayName = player.name;

					// Only lock the camera if you're not in the lobby
					if (this.#currentStage.type !== "lobby") {
						conn.send({
							type: "camera-lock",
							entityId: player.entity.id,
							freeRotation: true,
							pov: "first-person",
						});
					}
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
					case "crafting":
					case "combat": {
						this.#currentStage = { ...this.#currentStage, endTime: Date.now() };
						break;
					}
				}
				break;
			}
			case "--debug-tp": {
				const player = this.#players.get(conn.id);
				if (!player?.entity) {
					return;
				}
				if (player.entity.getPos()[1] > 50) {
					player.entity.body.position = new phys.Vec3(0, 0, 0);
				} else {
					player.entity.body.position = new phys.Vec3(0, 60, 0);
				}
				break;
			}
			case "--debug-wireframes":
				const player = this.#players.get(conn.id);
				console.log(player, data);
				if (player) {
					player.debug = data.val;
				}
				break;
			default:
				console.warn(`Unhandled message '${data["type"]}'`);
		}
	}

	// #region Game State
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
			player.entity.isInvulnerableThisTick = false;
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
					// this.playSound("useFail", player.entity.getPos());
				}
			}
			const attack = player.entity.attack();
			player.attackAction = attack?.type;
			if (posedge.attack) {
				if (attack) {
					attack.commit();
				} else {
					// this.playSound("attackFail", player.entity.getPos());
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
						"resource",
					),
				);
				log(`Player ${player.id.slice(0, 6)} spawned ${modelId}`);
			}
		}
		if (this.#minecart !== null) {
			this.#minecart.isInvulnerableThisTick = false;
		}
		this.#nextTick();
	}

	#nextTick() {
		this.#currentTick++;

		// Tick the world
		this.#world.nextTick();

		// Tick the player inputs
		for (let input of this.#createdInputs) {
			input.serverTick();
		}

		// Tick each of the entities
		for (let entity of this.#entities.values()) {
			entity.tick();
		}

		for (let [boss, timer] of this.#bossResets.entries()) {
			timer--;
			if (timer <= 0) {
				this.#bossResets.delete(boss);
				this.teleportBoss(boss);
				continue;
			}
			this.#bossResets.set(boss, timer);
		}

		// Run delete jobs
		if (this.#toCreateQueue.length > 0 || this.#toDeleteQueue.length > 0) {
			this.clearEntityQueues();
		}

		// Handle game state changes
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
			role: !player.entity ? "spectator" : player.entity.isBoss ? "boss" : "hero",
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
				physicsBodies: player.debug ? this.#world.serialize() : undefined,
				others: Array.from(this.#players.values(), (p) =>
					p === player ? [] : [this.#serializeNetworkedPlayer(p)],
				).flat(),
				me: this.#serializeNetworkedPlayer(player),
			});
		}
	}

	#reset() {
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
	// #endregion

	// #region Entity
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
}

/**
 * Whether the server is being compiled for the browser. This is set by the
 * `esbuild` bundle options in `package.json`.
 */
declare var BROWSER: boolean;
