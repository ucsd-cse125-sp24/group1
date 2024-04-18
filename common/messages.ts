import { Vector2, Vector3, Quaternion } from "./commontypes";

export type ServerMessage = { type: "ping" } | { type: "pong" } | EntireGameState;

export type ClientMessage = { type: "ping" } | { type: "pong" } | ClientInputMessage;

export type EntireGameState = {
	type: "entire-game-state";
	entities: SerializedEntity[];
};

export type ClientInputs = {
	[key: string]: any;
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

<<<<<<< HEAD
export type SerializedCollider = BoxCollider | PlaneCollider | SquareCollider | SphereCollider | CylinderCollider;
=======
export type SerializedCollider = BoxCollider | PlaneCollider | SphereCollider;
>>>>>>> d13b67a8ca96ce54b78f82e8f30247033bdc40e8

/**
 * Represents an infinite plane. By default, it represents the xy-plane at z =
 * 0.
 */
export type PlaneCollider = {
	type: "plane";
};

export type SphereCollider = {
	type: "sphere";
	radius: number;
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

export type SphereCollider = {
	type: "sphere",
	radius: number
};

export type CylinderCollider = {
	type: "cylinder",
	radiusTop: number,
	radiusBottom: number,
	height: number,
	numSegments: number
}