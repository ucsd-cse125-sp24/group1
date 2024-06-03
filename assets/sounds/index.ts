import attackFail from "./Miss 1.wav";
import craftingEjectAll from "./Crafting Fail.wav";
import craftingPickup from "./Crafting 1.wav";
import craftingSuccess from "./Crafting Success.wav";
import defaultHit1 from "./Hit 1.wav";
import defaultHit2 from "./Hit 2.wav";
import defaultHit3 from "./Hit 3.wav";
import defaultHit4 from "./Hit 4.wav";
import defaultHit5 from "./Hit 5.wav";
import defaultHit6 from "./Hit 6.wav";
import hit from "./hit.mp3";
import jump from "./Jump 1.wav";
import pickup from "./Pick Up Wood.wav";
import popCraftingFail from "./Crafting Popping Fail.wav";
import popCrafting from "./Crafting Popping.wav";
import running from "./LIttle Guy Running 1.wav";
import spawnerHarvest from "./spawner-harvest.mp3";
import spawnerReject from "./spawner-reject.mp3";
import spore from "./Spored.wav";
import throwSound from "./throw.mp3";
import trapDisarm from "./trap-disarm.mp3";
import trapEscape from "./trap-escape.mp3";
import trapHit from "./trap-hit.mp3";
import trapPlace from "./trap-place.mp3";
import trapTriggered from "./trap-triggered.mp3";
import useFail from "./use-fail.mp3";
export { default as reverbImpulse } from "./AndrewsChurchConvReverb2.wav";

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
	defaultHit: [defaultHit1, defaultHit2, defaultHit3, defaultHit4, defaultHit5, defaultHit6],
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
	/** Running ambient sound */
	running,
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
