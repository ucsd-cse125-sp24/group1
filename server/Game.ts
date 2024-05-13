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
import { sampleMap } from "../assets/models/sample_map/server-mesh";
import { TheWorld } from "./physics";
import { PlayerInput } from "./net/PlayerInput";
import { PlayerEntity } from "./entities/PlayerEntity";
import { Entity } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { SphereEntity } from "./entities/SphereEntity";
import { CylinderEntity } from "./entities/CylinderEntity";
import { Connection, ServerHandlers } from "./net/Server";
import { HeroEntity } from "./entities/HeroEntity";
import { StaticEntity } from "./entities/StaticEntity";
import { createTrimesh } from "./mesh";
import { Item } from "./entities/Interactable/Item";
import { CraftingTable } from "./entities/Interactable/CraftingTable";

export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	// Store all of the player inputs, there is just one for now
	#playerInputs: PlayerInput[];
	#players: PlayerEntity[];

	#entities: { [key: string]: Entity };
	#bodyToEntityMap: Map<Body, Entity>;
	// player array
	// mapping from socket to player

	constructor(numPlayers: number) {
		this.#playerInputs = [];
		this.#players = [];
		this.#entities = {};
		this.#bodyToEntityMap = new Map();
	}

	/**
	 * Registers an entity in the physics world and in the game state
	 * so that it can be interacted with. Unregistered entities do not
	 * affect the game in any way
	 * @param entity the constructed entity to register
	 */
	registerEntity(entity: Entity) {
		this.#entities[entity.name] = entity;
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
		delete this.#entities[entity.name];
		this.#bodyToEntityMap.delete(entity.body);
		entity.removeFromWorld(TheWorld);
	}

	/**
	 * A function that sets up the base state for the game
	 */
	async setup() {
		const mapMesh = createTrimesh(await sampleMap);
		const mapEntity = new StaticEntity("the map", [0, -5, 0], mapMesh, [{ modelId: "sampleMap", offset: [0, 0.5, 0] }]);
		this.registerEntity(mapEntity);

		let p1 = new HeroEntity("Player One", [20, 20, 20], ["samplePlayer"]);
		this.#players.push(p1);
		this.registerEntity(p1);

		let plane = new PlaneEntity("normal plane", [0, -5, 0], [-1, 0, 0, 1], []);
		this.registerEntity(plane);

		let iron = new Item("Iron Ore", 0.1, [10, 10, 10], ["donut"], "resource");
		this.registerEntity(iron);

		let tempCrafter = new CraftingTable("crafter", [17, 0, 17], ["samplePlayer"], [["Iron Ore"]]);
		this.registerEntity(tempCrafter);

		let tempSphere = new SphereEntity("temp sphere 1", [1, 20, 1], 2);
		this.registerEntity(tempSphere);

		let tempCylinder = new CylinderEntity("temp cylinder 1", [1, 20, 5], 1.5, 5);
		this.registerEntity(tempCylinder);

		let input1 = new PlayerInput();
		this.#playerInputs.push(input1);
	}

	updateGameState() {
		for (let [idx, playerInput] of this.#playerInputs.entries()) {
			let inputs = playerInput.getInputs();
			let posedge = playerInput.getPosedge();
			let player = this.#players[idx];

			//console.clear();
			//console.log(inputs);

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

			player.move(movement);

			let checkerRay = new phys.Ray(player.getPos(), player.getPos().vadd(new phys.Vec3(...movement.lookDir)));

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
		conn.send({ type: "camera-lock", entityName: "Player One", pov: "first-person" });
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
			case "client-input": //THIS ONLY CHECKS PLAYER 1
				this.#playerInputs[0].updateInputs(data);
				break;
		}
	}

	#nextTick() {
		TheWorld.nextTick();
		for (let input of this.#playerInputs) {
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
