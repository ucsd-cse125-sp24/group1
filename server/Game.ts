/**
 * This manages the entire state of the game. Any gameplay specific elements
 * should be placed into this file or included into this file, and any interactions
 * that affect the state of the game must eventually be guaranteed to pass through
 * this class.
 *
 * This class serves as the ground source of truth for anything concerning the game
 */

import { TheWorld, v3 } from "./physics";
import { PlayerInput } from "./net/PlayerInput";
import { ClientInputs, ClientMessage, SerializedEntity, ServerMessage } from "../common/messages";
import { PlayerEntity } from "./entities/PlayerEntity";
import { CubeEntity } from "./entities/CubeEntity";
import { Entity } from "./entities/Entity";
import { Body, Cylinder, Plane, Sphere } from "cannon-es";
import { MovementInfo, Vector3 } from "../common/commontypes";
import { PlaneEntity } from "./entities/PlaneEntity";
import { SphereEntity } from "./entities/SphereEntity";
import { CylinderEntity } from "./entities/CylinderEntity";
import { ServerHandlers } from "./net/Server";

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
	setup() {
		let p1 = new PlayerEntity("Player One", [20, 20, 20], ["samplePlayer"]);
		this.#players.push(p1);
		this.registerEntity(p1);

		let rock = new CubeEntity("rock", [0, 100, 0], ["fish1"]);
		this.registerEntity(rock);

		let plane = new PlaneEntity("normal plane", [0, -5, 0], [-1, 0, 0, 1], ["sampleMap"]);
		this.registerEntity(plane);

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
		}

		this.#nextTick();
	}

	/**
	 * Welcomes a new connection by bombarding it with a bunch of emails as part
	 * of its onboarding process
	 * @returns Messages to send to the new client
	 */
	handleOpen(id: number): ServerMessage[] {
		// TODO: Create a player corresponding to this connection and lock the
		// client's camera to it. This may involve reworking Server.ts to give
		// access to WebSocket connection objects that you can store in each player
		// object; if so, you can switch the server to always use WsServer.ts (and
		// ignore the web worker stuff) until you get it working
		return [{ type: "camera-lock", entityName: "Player One" }];
	}

	/**
	 * Parses a raw websocket message, and then generates a response to the
	 * message if that is needed
	 * @param rawData the raw message data to process
	 * @param id A unique ID for the connection. Note that the same player may
	 * disconnect and reconnect, and this new connection will have a new ID.
	 * @returns a ServerMessage
	 */
	handleMessage(data: ClientMessage, id: number): ServerMessage | undefined {
		switch (data.type) {
			case "ping":
				return {
					type: "pong",
				};
			case "pong":
				return {
					type: "ping",
				};
			case "client-input": //THIS ONLY CHECKS PLAYER 1
				this.#playerInputs[0].updateInputs(data);
				break;
		}
		return;
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
