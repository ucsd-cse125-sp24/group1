import { cavecube } from "./cavecube";
import { defaultCube } from "./default-cube";
import { defaultCubeColor } from "./default-cube-color";
import { donut } from "./donut";
import { fish1 } from "./fish1";
import { fish2 } from "./fish2";

export const models = {
	fish1,
	fish2,
	cavecube,
	defaultCube,
	defaultCubeColor,
	donut,
};

export type ModelId = keyof typeof models;
