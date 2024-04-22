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
import { Body } from "cannon-es";

export class Game {
	// Store all of the player inputs, there is just one for now
	#playerInput: PlayerInput;
	#entities: { [key: string]: Entity };
	#entityMap: Map<Body, Entity>;
	// player array
	// mapping from socket to player

	constructor(numPlayers: number) {
		this.#playerInput = new PlayerInput(); //new Array(numPlayers).fill(0).map((_) => new PlayerInput());
		this.#entities = {};
		this.#entityMap = new Map();
	}

	//TODO: Create a fucntion that can more easily create Entities
	//by god please

	/**
	 * A function that sets up the base state for the game
	 */
	setup() {
		// let p1 = new PlayerEntity("Player One", [0, 0, 0], ["fish1"]);
		// this.#entities.p1 = p1;
		// this.#entityMap.set(p1.body, p1);
		// p1.addToWorld(TheWorld);

		let rock = new CubeEntity("rock", [0, 100, 0], ["fish1"]);
		this.#entityMap.set(rock.body, rock);
		this.#entities.rock = rock;
		rock.addToWorld(TheWorld);
	}

	updateGameState() {
		if (this.#playerInput.getInputs().forward) {
			this.#entities.rock.body.applyForce(v3(0, 0, -3));
		}
		this.#nextTick();
	}

	/**
	 * Parses a raw websocket message, and then generates a
	 * response to the message if that is needed
	 * @param rawData the raw message data to process
	 * @returns a ServerMessage
	 */
	handleMessage(data: ClientMessage): ServerMessage | undefined {
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
				this.#playerInput.updateInputs(data);
				break;
		}
		return;
	}

	#nextTick() {
		TheWorld.nextTick();
		this.#playerInput.serverTick();
		//for (let input of this.#playerInput) {
		//	input.serverTick();
		//}
	}

	serialize(): SerializedEntity[] {
		let serial = [];

		for (let entity of Object.values(this.#entities)) {
			serial.push(entity.serialize());
		}
		return serial;
	}
}
