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
} & ClientInputs;

export type SerializedEntity = {
	geometryId: number;
	materialId: number;
	quaternion: Quaternion;
	position: Vector3;
	colliders: SerializedCollider[];
};

export type Vector3 = [x: number, y: number, z: number];
export type Quaternion = [x: number, y: number, z: number, w: number];

export type SerializedCollider = BoxCollider | PlaneCollider;

export type PlaneCollider = {
	type: "plane";
};

export type BoxCollider = {
	type: "box";
	size: Vector3;
};
