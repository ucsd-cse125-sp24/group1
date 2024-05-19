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
import { ClientMessage, SerializedEntity, ServerMessage } from "../common/messages";
import { MovementInfo } from "../common/commontypes";
import { sampleMapColliders } from "../assets/models/sample-map-colliders/server-mesh";
import { TheWorld } from "./physics";
import { PlayerInput } from "./net/PlayerInput";
import { PlayerEntity } from "./entities/PlayerEntity";
import { BossEntity } from "./entities/BossEntity";
import { Entity } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { SphereEntity } from "./entities/SphereEntity";
import { CylinderEntity } from "./entities/CylinderEntity";
import { Connection, ServerHandlers } from "./net/Server";
import { HeroEntity } from "./entities/HeroEntity";
import { InteractableEntity } from "./entities/Interactable/InteractableEntity";
import { getColliders } from "./entities/map/colliders";
import { MapEntity } from "./entities/map/MapEntity";
import { Item } from "./entities/Interactable/Item";
import { CraftingTable } from "./entities/Interactable/CraftingTable";

interface NetworkedPlayer {
	input: PlayerInput;
	entity: PlayerEntity;
	id: string;
	conn: Connection<ServerMessage>;
}

export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	#players: Map<string, NetworkedPlayer>;
	#createdInputs: PlayerInput[];

	#entities: Map<string, Entity>;
	#bodyToEntityMap: Map<Body, Entity>;

	// player array
	// mapping from socket to player
	constructor() {
		this.#createdInputs = [];
		this.#players = new Map();
		this.#entities = new Map();
		this.#bodyToEntityMap = new Map();
	}

	/**
	 * Registers an entity in the physics world and in the game state
	 * so that it can be interacted with. Unregistered entities do not
	 * affect the game in any way
	 * @param entity the constructed entity to register
	 */
	registerEntity(entity: Entity) {
		this.#entities.set(entity.name, entity);
		this.#bodyToEntityMap.set(entity.body, entity);

		// this is one way to implement collision that uses bodyToEntityMap without passing Game reference to entities
		entity.body.addEventListener(Body.COLLIDE_EVENT_NAME, (params: { body: Body; contact: any }) => {
			const otherBody: Body = params.body;
			const otherEntity: Entity | undefined = this.#bodyToEntityMap.get(otherBody);
			if (otherEntity) entity.onCollide(otherEntity);
		});

		entity.addToWorld(TheWorld);
	}

	unregisterEntity(entity: Entity) {
		this.#entities.delete(entity.name);
		this.#bodyToEntityMap.delete(entity.body);
		entity.removeFromWorld(TheWorld);
	}

	/**
	 * TODO: call this function
	 */
	verifyState() {
		let error = false;
		for (const body of TheWorld.getPhantomBodies(this.#bodyToEntityMap)) {
			console.warn(`Body ${body.id} is missing entity`);
			error = true;
		}
		const entities = Array.from(this.#entities.values());
		for (const entity of this.#bodyToEntityMap.values()) {
			if (!entities.includes(entity)) {
				console.warn(`#bodyToEntityMap maps to an entity '${entity.name}' not in #entities`);
				error = true;
			}
		}
		if (error) {
			throw new Error("The game is not in sync with the physics engine. Errors have been reported in the conosle.");
		}
	}

	/**
	 * A function that sets up the base state for the game
	 */
	async setup() {
		const mapColliders = getColliders(await sampleMapColliders);
		const mapEntity = new MapEntity("the map", [0, -5, 0], mapColliders, [{ modelId: "sampleMap" }]);
		this.registerEntity(mapEntity);

		let plane = new PlaneEntity("normal plane", [0, -5, 0], [-1, 0, 0, 1], []);
		this.registerEntity(plane);

		let bigIron = new Item("Iron1", "iron-ore", 0.5, [18, 0, 15], [{modelId: "samplePlayer", scale: .5}], "resource");
		this.registerEntity(bigIron);

		let smallIron = new Item("Iron2", "iron-ore", 0.5, [10, 0, 10], [{modelId: "samplePlayer", scale: .5}], "resource");
		this.registerEntity(smallIron);

		let Pick = new Item("pickaxe", "pickaxe", 0.5, [15, 0, 15], [{modelId: "fish1", scale: .75}], "tool");
		this.registerEntity(Pick);

		let tempCrafter = new CraftingTable("crafter", [18, 0, 18], [{ modelId: "fish1", scale: 10 }], [["iron-ore", "String"]]);
		this.registerEntity(tempCrafter);

		let tempSphere = new SphereEntity("temp sphere 1", [1, 20, 1], 2);
		this.registerEntity(tempSphere);

		let tempCylinder = new CylinderEntity("temp cylinder 1", [1, 20, 5], 1.5, 5);
		this.registerEntity(tempCylinder);
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

			const body = player.entity.lookForInteractables();
			// if (posedge.use) console.log("USE CLICKED WAWFAHDKSLHALKDJHASJLKDHASJKd"); // Use is not being activated
			if (posedge.use && body != null) {
				const lookedAtEntity = this.#bodyToEntityMap.get(body as phys.Body);
				if (lookedAtEntity) {
					if (lookedAtEntity instanceof InteractableEntity) lookedAtEntity.interact(player.entity);
				}
			}
		}
		this.#nextTick();
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
				playerEntity = new HeroEntity(conn.id, [20, 20, 20], ["samplePlayer"]);
			} else {
				playerEntity = new BossEntity(conn.id, [20, 20, 20], ["samplePlayer"]);
			}
			this.registerEntity(playerEntity);

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
			entityName: conn.id,
			pov: player.entity instanceof BossEntity ? "top-down" : "first-person",
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
				if (data.keepBody) {
					// Ensure camera does not lock to it
					player.entity.name = `formerly ${player.entity.name}`;
				} else {
					this.unregisterEntity(player.entity);
				}
				const newEntity = new (player.entity instanceof BossEntity ? HeroEntity : BossEntity)(
					conn.id,
					[20, 20, 20],
					["samplePlayer"],
				);
				this.registerEntity(newEntity);
				player.entity = newEntity;
				conn.send({
					type: "camera-lock",
					entityName: conn.id,
					pov: player.entity instanceof BossEntity ? "top-down" : "first-person",
				});
				break;
			default:
				console.warn(`Unhandled message '${data["type"]}'`);
		}
	}

	#nextTick() {
		TheWorld.nextTick();
		for (let input of this.#createdInputs) {
			input.serverTick();
		}
	}

	serialize(): SerializedEntity[] {
		let serial: SerializedEntity[] = [];

		for (let [id, entity] of this.#entities.entries()) {
			serial.push(entity.serialize());
		}

		return serial;
	}
}
