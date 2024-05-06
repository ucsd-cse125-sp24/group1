import { Vector2, Vector3, Quaternion } from "./commontypes";
import { ModelId } from "./models";

export type ServerMessage = { type: "ping" } | { type: "pong" } | EntireGameState | CameraLock;

export type ClientMessage = { type: "ping" } | { type: "pong" } | ClientInputMessage;

export type WSManagementMessage = {
	type: "rejoin";
	id: string;
};

export type EntireGameState = {
	type: "entire-game-state";
	entities: SerializedEntity[];
};

/**
 * A message from the server that tells the client to make the camera follow an
 * entity, locking the camera to its position. The client is free to rotate its
 * camera around in first-person mode, however.
 */
export type CameraLock = {
	type: "camera-lock";
	/**
	 * Name of the entity to lock the camera to. If there are multiple entities
	 * with the same name, the client will hide all of them, but only lock to the
	 * first entity with the name. If there is no entity with such name, the
	 * camera may stop moving.
	 */
	entityName: string;
	/**
	 * Camera point of view directive. In first-person mode, the camera locks to
	 * the POV of the entity and can rotate freely. In top-down mode, the camera
	 * locks to a point above the entity and has fixed rotation looking downward.
	 */
	pov: "first-person" | "top-down";
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
	lookDir: Vector3;
};

export type ClientInputMessage = {
	type: "client-input";
} & ClientInputs;

export type SerializedEntity = {
	name: string;
	//possible that we need to send model position
	model: ModelId[];
	quaternion: Quaternion;
	position: Vector3;
	colliders: SerializedCollider[];
	// for future reference we need to include velocity for movement prediction
};

export type SerializedCollider = (BoxCollider | PlaneCollider | SquareCollider | SphereCollider | CylinderCollider) & {
	offset?: Vector3;
};

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

export type SphereCollider = {
	type: "sphere";
	radius: number;
};

export type CylinderCollider = {
	type: "cylinder";
	radiusTop: number;
	radiusBottom: number;
	height: number;
	numSegments: number;
};
