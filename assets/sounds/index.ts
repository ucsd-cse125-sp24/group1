import attackFail from "./attack-fail.mp3";
import craftingEjectAll from "./crafting-eject-all.mp3";
import craftingPickup from "./crafting-pickup.mp3";
import craftingSuccess from "./crafting-success.mp3";
import hit from "./hit.mp3";
import jump from "./jump.mp3";
import pickup from "./pickup.mp3";
import popCraftingFail from "./pop-crafting-fail.mp3";
import popCrafting from "./pop-crafting.mp3";
import spawnerHarvest from "./spawner-harvest.mp3";
import spawnerReject from "./spawner-reject.mp3";
import spore from "./spore.mp3";
import throwSound from "./throw.mp3";
import trapDisarm from "./trap-destroy.mp3";
import trapEscape from "./trap-escape.mp3";
import trapHit from "./trap-hit.mp3";
import trapPlace from "./trap-place.mp3";
import trapTriggered from "./trap-triggered.mp3";
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
	spawnerHarvest,
	spawnerReject,
	spore,
	throw: throwSound,
	trapDisarm,
	trapEscape,
	trapHit,
	trapPlace,
	trapTriggered,
	useFail,
};

export type SoundId = keyof typeof sounds;
