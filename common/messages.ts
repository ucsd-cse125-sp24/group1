export type ServerMessage = 
	{ type: "ping" } |
	{ type: "pong" } |
	{ 
		type: "CUBEEEEE",
		x:number,
		y:number,
		z:number
	} |
	EntireGameState;

export type ClientMessage =
	| { type: "ping" }
	| { type: "pong" } 
	| ClientInputMessage;

export type EntireGameState = {
	type: "entire-game-state",
	
}

export type ClientInputs = {
	forward: boolean;
	backward: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
	attack: boolean;
	use: boolean;
	emote: boolean;
}

export type ClientInputMessage = {
	type: "client-input";
} & ClientInputs;