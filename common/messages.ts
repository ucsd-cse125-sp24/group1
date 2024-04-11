/**
 * Example of a discriminated union to represent the types of messages sent
 * between the server and client
 */
export type ServerMessage =
	| { type: "ping" }
	| { type: "pong" }
	| {
			type: "usernames";
			usernames: string[];
	  }
	| {
			type: "set-size";
			width: number;
			height: number;
	  };

export type ClientMessage =
	| { type: "ping" }
	| { type: "pong" }
	| {
			type: "usernames";
			usernames: string[];
	  }
	| {
			type: "set-size";
			width: number;
			height: number;
	  };
