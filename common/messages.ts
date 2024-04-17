import { Vector2, Vector3, Quaternion } from "./commontypes";

export type ServerMessage =
	| { type: "ping" }
	| { type: "pong" }
	| {
			type: "CUBEEEEE";
			x: number;
			y: number;
			z: number;
	  }
	| EntireGameState;

export type ClientMessage = { type: "ping" } | { type: "pong" } | ClientInputMessage;

export type EntireGameState = {
	type: "entire-game-state";
	entities: SerializedEntity[];
};

export type ClientInputs = {
	forward: boolean;
	backward: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
	attack: boolean;
	use: boolean;
	emote: boolean;
};

export type ClientInputMessage = {
	type: "client-input";
	lookDir: Vector3;
} & ClientInputs;

export type SerializedEntity = {
	geometryId: number;
	materialId: number;
	quaternion: Quaternion;
	position: Vector3;
	colliders: SerializedCollider[];
};

export type SerializedCollider = BoxCollider | PlaneCollider | SquareCollider;

/**
 * Represents an infinite plane. By default, it represents the xy-plane at z =
 * 0.
 */
export type PlaneCollider = {
	type: "plane";
};

/**
 * Represents a finite plane with side length 2. By default, it represents a
 * flat square with side lengths `2 * size` on the xy-plane, so its vertices are
 * between `(-x, -y, 0)` and `(x, y, 0)`.
 */
export type SquareCollider = {
	type: "square";
	size: Vector2;
};

/**
 * Represents a box. By default, it is a box with side lengths `2 * size`
 * centered about the origin, so its vertices are between `(-x, -y, -z)` and
 * `(x, y, z)`.
 */
export type BoxCollider = {
	type: "box";
	size: Vector3;
};
