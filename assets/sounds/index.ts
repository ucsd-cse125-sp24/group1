import attackFail from "./attack-fail.mp3";
import craftingEjectAll from "./crafting-eject-all.mp3";
import craftingPickup from "./crafting-pickup.mp3";
import craftingSuccess from "./crafting-success.mp3";
import hit from "./hit.mp3";
import jump from "./jump.mp3";
import pickup from "./pickup.mp3";
import popCraftingFail from "./pop-crafting-fail.mp3";
import popCrafting from "./pop-crafting.mp3";
import useFail from "./use-fail.mp3";

export const sounds = {
	attackFail,
	craftingEjectAll,
	craftingPickup,
	craftingSuccess,
	hit,
	jump,
	pickup,
	popCraftingFail,
	popCrafting,
	useFail,
};

export type SoundId = keyof typeof sounds;
