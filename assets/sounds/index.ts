import attackFail from "./attack-fail.mp3";
import craftingEjectAll from "./crafting-eject-all.mp3";
import craftingPickup from "./crafting-pickup.mp3";
import craftingSuccess from "./crafting-success.mp3";
import defaultHit1 from "./default-hit1.mp3";
import defaultHit2 from "./default-hit2.mp3";
import defaultHit3 from "./default-hit3.mp3";
import hit from "./hit.mp3";
import jump from "./jump.mp3";
import pickup from "./pickup.mp3";
import popCraftingFail from "./pop-crafting-fail.mp3";
import popCrafting from "./pop-crafting.mp3";
import spawnerHarvest from "./spawner-harvest.mp3";
import spawnerReject from "./spawner-reject.mp3";
import spore from "./spore.mp3";
import throwSound from "./throw.mp3";
import trapDisarm from "./trap-disarm.mp3";
import trapEscape from "./trap-escape.mp3";
import trapHit from "./trap-hit.mp3";
import trapPlace from "./trap-place.mp3";
import trapTriggered from "./trap-triggered.mp3";
import useFail from "./use-fail.mp3";
export { default as reverbImpulse } from "./reverb-impulse.mp3";

export const sounds = {
	/** Player tries to attack but it's not aimed at anything. */
	attackFail,
	/**
	 * A crafter ejects all items right after absorbing an item because it cannot
	 * form a valid recipe.
	 */
	craftingEjectAll,
	/** A crafter absorbs an item and is waiting for more items. */
	craftingPickup,
	/** A crafter absorbs an item and spits out the result. */
	craftingSuccess,
	/**
	 * Player attacks an interactable object (e.g. item, crafter), which does a
	 * little knockback.
	 */
	defaultHit: [defaultHit1, defaultHit2, defaultHit3],
	/** Player attacks another player (currently just does knockback). */
	hit,
	/** Player jumps. */
	jump,
	/** A hero picks up an item. */
	pickup,
	/** Attempting to remove an item stored in an empty crafter. */
	popCraftingFail,
	/** Removing an item stored in a crafter. */
	popCrafting,
	/** Correct tool used on a spawner, spawning an item. */
	spawnerHarvest,
	/** Incorrect tool used on a spawner. */
	spawnerReject,
	/** A boss spores a hero. */
	spore,
	/** Played when a hero throws an item they're holding. */
	throw: throwSound,
	/** Someone deletes a trap that isn't trapping a player */
	trapDisarm,
	/**
	 * A hero is freed from the trap. The trap disappears. It's played
	 * alongside `trapHit` (but we can change this).
	 */
	trapEscape,
	/** Trapped hero hits the trap. It needs multiple hits to free the hero. */
	trapHit,
	/** Boss spawns a trap. */
	trapPlace,
	/** Hero steps onto a trap. */
	trapTriggered,
	/** Player tries to use but it doesn't do anything. */
	useFail,
};

export type SoundId = keyof typeof sounds;
