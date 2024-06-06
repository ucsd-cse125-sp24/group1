import { ModelId } from "../assets/models";
import { SoundId } from "../assets/sounds";
import { EntityId } from "../server/entities/Entity";
import { Vector2, Vector3, Quaternion, Vector4 } from "./commontypes";

export type ServerMessage =
	| { type: "ping" }
	| { type: "pong" }
	| EntireGameState
	| CameraLock
	| PlaySound
	| SabotageHero
	| GameOver
	| Damage
	| PlayParticle;

export type ClientMessage =
	| { type: "ping" }
	| { type: "pong" }
	| ClientInputMessage
	| ChangeDisplayName
	| ChangeRole
	| StartGame
	| DebugMessages;

export type DebugMessages = { type: "--debug-skip-stage" };

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
	/** Preferred player name */
	name?: string;
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
			startTime: number;
			/** Timestamp (milliseconds since Unix epoch) of end of crafting stage */
			endTime: number;
	  }
	| {
			type: "combat";
			startTime: number;
			/** Timestamp (milliseconds since Unix epoch) of end of crafting stage */
			endTime: number;
	  }
	| {
			type: "gameover";
			winner: "hero" | "boss";
			endTime: number;
	  };

export type EntireGameState = {
	type: "entire-game-state";
	stage: GameStage;
	entities: Record<EntityId, SerializedEntity>;
	/**
	 * All physics engine colliders to draw wireframes around for debug purposes.
	 * These should be drawn directly as given; do not try to interpolate or
	 * predict positions on these bodies.
	 */
	physicsBodies: SerializedBody[];
	me: PlayerEntry;
	others: PlayerEntry[];
};

export type PlayerEntry = {
	name: string;
	role: Role;
	entityId?: EntityId;
	useAction?: Use;
	attackAction?: Attack;
	online: boolean;
	health?: number;
};

export type Role = "boss" | "hero" | "spectator";
export type Skin = "red" | "yellow" | "green" | "blue";

export type Use =
	| "bigboss:shoot-shroom"
	| "throw-item"
	| "pickup-item"
	| "pop-crafter"
	| "boss:spore"
	| "boss:place-trap"
	| "bigboss:";
export type Attack =
	| "hero:shoot-arrow"
	| "crafting-stage:slap-player"
	| "combat:damage"
	| "disarm-trap"
	| "damage-trap"
	| "slap-non-player"
	| "hit-mini-boss";
export type Action<ActionType> = {
	/**
	 * The type of action that would be performed if the player activates it. This
	 * is shown in the client as an available action.
	 */
	type: ActionType;
	/**
	 * Called when the player activates it. For example, for `Action<Use>`, this
	 * is called when the player presses right click.
	 */
	commit: () => void;
};

export type Damage = { type: "damage" };

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
	 * ID, the camera will enter freecam mode to allow for spectating.
	 */
	entityId: EntityId;
	/**
	 * Whether to allow the camera to rotate freely. `pov` must be `first-person`.
	 */
	freeRotation: boolean;
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
	options: Partial<ParticleOptions>;
};
export type ParticleOptions = {
	/**
	 * Length of time between particle spawns in milliseconds. Set to +inf to only
	 * spawn particles one time when the `ParticleSystem` is (re-)enabled.
	 * Default: Infinity
	 */
	spawnPeriod: number;
	/**
	 * Number of particles to create in each spawn batch. Default: 1
	 */
	spawnCount: number;
	/** Default: 256 */
	size: number;
	/** Default: `[1, 1, 1, 1]` (opaque white) */
	color: Vector4;
	/** Can be positive, 0, or negative. Default: 1 */
	mass: number;
	/** Default: `[0, 0, 0]` */
	initialPosition: Vector3;
	/** Default: `[0, 1, 0]` */
	initialVelocity: Vector3;
	/**
	 * If this property is set, then new particles will spawn with a random
	 * initial velocity - each component i will be sampled from a uniform
	 * distribution centered on initialVelocity[i].
	 */
	initialVelocityRange?: Vector3;
	/** Remaining time to live in seconds. Default: 5 */
	ttl: number;
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
	role: Role;
	skin?: Skin;
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
export type TextModelFont = {
	color?: string;
	family?: string;
	weight?: string;
};
export type TextModelObject = {
	text: string;
	offset?: Vector3;
	rotation?: Quaternion;
	height?: number;
	resolution?: number;
	font?: TextModelFont;
};
export type EntityModel = ModelId | EntityModelObject | TextModelObject;

export type SerializedEntity = {
	id: EntityId;
	model: EntityModel[];
	/**
	 * A light anchored to the entity.
	 *
	 * Clients can only handle up to 12 lights in the world.
	 *
	 * The client is optimized so that turning on and off a light (by setting
	 * `light` to `undefined`) will not re-cast shadows (slow) if `light.willMove`
	 * is false. This way, you can have static lights blink or flash. Disabled
	 * lights do not count towards the 12-light limit.
	 */
	light?: SerializedLight;
	quaternion: Quaternion;
	position: Vector3;
	/**
	 * Whether the object is fixed and stationary and can't or won't move. If
	 * true, the entity makes for a great candidate for pre-calculating shadows.
	 */
	isStatic: boolean;
	// for future reference we need to include velocity for movement prediction

	// Client uses this state on camera locked entity to determine visual effects
	isSabotaged?: boolean;
	isTrapped?: boolean;
	// NOTE: currently unused (PlayerEntity.health is used instead)
	health?: number;
};

/**
 * Changing `color` and `falloff` are very fast, but changing the light's
 * position (by moving the entity or changing `offset`) will slow down the game.
 */
export type SerializedLight = {
	/**
	 * HSV. Value can be above 1 for greater brightness, but it will result in a
	 * white circle in the middle.
	 */
	color: Vector3;
	/** The range of the light. */
	falloff?: number;
	/**
	 * Whether the light may move. If the light is false, the client can do
	 * optimizations by only casting shadows of entities that won't move
	 * (`isStatic`) once instead of every frame.
	 *
	 * Prefer having only `willMove: false` lights. Clients can only handle up to
	 * about 3 `willMove: true` lights. Every `willMove: true` light adds *six*
	 * more draw calls to every frame, so the first mobile light will make the
	 * game seven times laggier.
	 */
	willMove: boolean;
	offset?: Vector3;
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
