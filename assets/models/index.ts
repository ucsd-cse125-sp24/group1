import { fish1 } from "./fish1";
import { fish2 } from "./fish2";

export const models = {
	fish1,
	fish2,
};

export type ModelId = keyof typeof models;
