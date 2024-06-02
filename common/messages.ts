import { ModelId } from "../assets/models";
import { SoundId } from "../assets/sounds";
import { EntityId } from "../server/entities/Entity";
import { Vector2, Vector3, Quaternion } from "./commontypes";

export type ServerMessage =
	| { type: "ping" }
	| { type: "pong" }
	| EntireGameState
	| CameraLock
	| PlaySound
	| SabotageHero
	| GameOver
	| PlayParticle;

export type ClientMessage =
	| { type: "ping" }
	| { type: "pong" }
	| ClientInputMessage
	| ChangeDisplayName
	| ChangeRole
	| StartGame;

export type ClientControlMessage = {
	/**
	 * Used to tell the server whether it is a new player or a reconnecting
	 * player. If the client is reconnecting, it must supply its `id`.
	 *
	 * Note that the server is free to disregard reconnection requests and assign
	 * the client a new player ID. This can happen if it has been too long since
	 * the client last connected, so its corresponding player has been discarded.
	 */
	type: "join";
	/**
	 * If the player is new, you can just give an obviously invalid ID, like an
	 * empty string. The server will generate a new one for you.
	 */
	id: string;
};

export type ServerControlMessage = {
	type: "join-response";
	id: string;
};

export type GameStage =
	| {
			type: "lobby";
			/** Null if no games have been played yet */
			previousWinner: "hero" | "boss" | null;
	  }
	| {
			type: "crafting";
			/** Timestamp (milliseconds since Unix epoch) of end of crafting stage */
			endTime: number;
	  }
	| {
			type: "combat";
			/** Timestamp (milliseconds since Unix epoch) of end of crafting stage */
			endTime: number;
	  };

export type EntireGameState = {
	type: "entire-game-state";
	stage: GameStage;
	entities: SerializedEntity[];
	/**
	 * All physics engine colliders to draw wireframes around for debug purposes.
	 * These should be drawn directly as given; do not try to interpolate or
	 * predict positions on these bodies.
	 */
	physicsBodies: SerializedBody[];
};

export type GameOver = {
	type: "game-over";
	winner: "heroes" | "boss";
};

/**
 * A message from the server that tells the client to make the camera follow an
 * entity, locking the camera to its position. The client is free to rotate its
 * camera around in first-person mode, however.
 */
export type CameraLock = {
	type: "camera-lock";
	/**
	 * Name of the entity to lock the camera to. If there is no entity with the
	 * ID, the camera may stop moving.
	 */
	entityId: EntityId;
	/**
	 * Camera point of view directive. In first-person mode, the camera locks to
	 * the POV of the entity and can rotate freely. In top-down mode, the camera
	 * locks to a point above the entity and has fixed rotation looking downward.
	 */
	pov: "first-person" | "top-down";
};

export type PlaySound = {
	type: "sound";
	sound: SoundId;
	position: Vector3;
};

export type PlayParticle = {
	type: "particle";
	position: Vector3;
};

/**
 * Tells a client that it has been sabotaged by the boss. The client should
 * render a screen effect until the specified time.
 */
export type SabotageHero = {
	type: "sabotage-hero";
	/**
	 * Length of time to display the effect in milliseconds
	 */
	time: number;
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
	lookDir: Vector3;
};

export type ClientInputMessage = {
	type: "client-input";
} & ClientInputs;

export type ChangeDisplayName = {
	type: "change-name";
	name: string;
};

export type ChangeRole = {
	type: "change-role";
	role: "boss" | "hero" | "spectator";
	skin: "red" | "yellow" | "green" | "blue";
};

export type StartGame = {
	type: "start-game";
};

export type EntityModelObject = {
	modelId: ModelId;
	offset?: Vector3;
	rotation?: Quaternion;
	/** Scales evenly in all directions */
	scale?: number;
};
export type TextModelObject = {
	text: string;
	offset?: Vector3;
	rotation?: Quaternion;
	height?: number;
	resolution?: number;
	color?: Vector3;
	font?: string;
};
export type EntityModel = ModelId | EntityModelObject | TextModelObject;

export type SerializedEntity = {
	id: EntityId;
	model: EntityModel[];
	quaternion: Quaternion;
	position: Vector3;
	// for future reference we need to include velocity for movement prediction

	// Client uses this state on camera locked entity to determine visual effects
	isSabotaged?: boolean;
	isTrapped?: boolean;
};

export type SerializedBody = {
	quaternion: Quaternion;
	position: Vector3;
	colliders: SerializedCollider[];
};

export type SerializedColliderBase = BoxCollider | PlaneCollider | SquareCollider | SphereCollider | CylinderCollider;
export type SerializedCollider = SerializedColliderBase & {
	offset: Vector3;
	orientation: Quaternion;
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
