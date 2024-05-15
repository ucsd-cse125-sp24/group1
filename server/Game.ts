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
import { TheWorld } from "./physics";
import { PlayerInput } from "./net/PlayerInput";
import { PlayerEntity } from "./entities/PlayerEntity";
import { CubeEntity } from "./entities/CubeEntity";
import { Entity } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { SphereEntity } from "./entities/SphereEntity";
import { CylinderEntity } from "./entities/CylinderEntity";
import { Connection, ServerHandlers } from "./net/Server";
import { HeroEntity } from "./entities/HeroEntity";
import { Item } from "./entities/Interactable/Item";
import { CraftingTable } from "./entities/Interactable/CraftingTable";

interface NetworkedPlayer {
	input: PlayerInput,
	entity: PlayerEntity,
	id: string,
	conn: Connection<ServerMessage>
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
	 * A function that sets up the base state for the game
	 */
	setup() {
		let plane = new PlaneEntity("normal plane", [0, -5, 0], [-1, 0, 0, 1], ["sampleMap"]);
		this.registerEntity(plane);

		let iron = new Item("Iron Ore", 0.1, [10, 10, 10], ["donut"], "resource");
		this.registerEntity(iron);

		let tempCrafter = new CraftingTable("crafter", [17, 0, 17], ["samplePlayer"], [["Iron Ore"]]);
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
				jump: posedge.jump,
				lookDir: inputs.lookDir,
			};

			player.entity.move(movement);

			let checkerRay = new phys.Ray(player.entity.getPos(), player.entity.getPos().vadd(new phys.Vec3(...movement.lookDir)));

			/*
			const checkerRay = new phys.Ray(this.body.position, this.body.position.vadd(new phys.Vec3(0, -1, 0)));
			const result = TheWorld.castRay(checkerRay, {
			collisionFilterMask: Entity.ENVIRONMENT_COLLISION_GROUP,
			checkCollisionResponse: false,
			});
			// console.log(checkerRay);
			// console.log(result);

			this.onGround = false;
			if (result.hasHit) {
				if (result.distance <= 0.5 + Entity.EPSILON) {
					this.onGround = true;
				}
			}

			*/
		}

		this.#nextTick();
	}

	/**
	 * Welcomes a new connection by bombarding it with a bunch of emails as part
	 * of its onboarding process
	 * @returns Messages to send to the new client
	 */
	handleOpen(conn: Connection<ServerMessage>): void {
		// TODO: Create a player corresponding to this connection and lock the
		// client's camera to it. This may involve reworking Server.ts to give
		// access to WebSocket connection objects that you can store in each player
		// object; if so, you can switch the server to always use WsServer.ts (and
		// ignore the web worker stuff) until you get it working
		
	}

	handlePlayerJoin(id: string, conn: Connection<ServerMessage>) {
		if (this.#players.has(id)) {
			let player = this.#players.get(id) as NetworkedPlayer;
			player.conn = conn;
		} else {
			let player = new HeroEntity(id, [20, 20, 20], ["samplePlayer"]);
			this.registerEntity(player);

			let input = new PlayerInput();
			this.#createdInputs.push(input);

			this.#players.set(id, {
				id: id,
				conn: conn,
				input: input, 
				entity: player
			});
		}
		conn.send({ type: "camera-lock", entityName: id, pov: "first-person" });
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
		}
	}

	#nextTick() {
		TheWorld.nextTick();
		for (let input of this.#createdInputs) {
			input.serverTick();
		}
	}

	serialize(): SerializedEntity[] {
		let serial = [];

		for (let entity of Object.values(this.#entities)) {
			serial.push(entity.serialize());
		}
		return serial;
	}
}
