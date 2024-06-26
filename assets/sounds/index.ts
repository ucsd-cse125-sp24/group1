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
import hit from "./Hit Player.wav";
import hitBig from "./Hit Player Big.wav";
import jump from "./Jump 1.wav";
import pickup from "./Pick Up Wood.wav";
import popCraftingFail from "./Crafting Popping Fail.wav";
import popCrafting from "./Crafting Popping.wav";
import spawnerHarvest from "./Spawn Item.wav";
import spawnerReject from "./Spawn Item Fail.wav";
import spore from "./Spored.wav";
import throwSound from "./Throw.wav";
import trapDisarm from "./Trap Disarm.wav";
import trapEscape from "./Trap Escape.wav";
import trapHit from "./Trap Hit.wav";
import trapPlace from "./Trap Place.wav";
import trapTriggered from "./Trap Trigger.wav";
import useFail from "./use-fail.mp3"; // IGNORE: no feedback for failures
import walkLeft1 from "./Step L 1.wav";
import walkLeft2 from "./Step L 2.wav";
import walkLeft3 from "./Step L 3.wav";
import walkLeft4 from "./Step L 4.wav";
import walkLeft5 from "./Step L 5.wav";
import walkRight1 from "./Step R 1.wav";
import walkRight2 from "./Step R 2.wav";
import walkRight3 from "./Step R 3.wav";
import walkRight4 from "./Step R 4.wav";
import walkRight5 from "./Step R 5.wav";
export { default as reverbImpulse } from "./AndrewsChurchConvReverb2.wav";
// TODO: boss swing, boss projectiles
import bossGrowl from "./Boss Growl.wav";
import bossMelee from "./Boss Melee.wav";
import bossRange from "./Boss Range.wav";
import death from "./Death.wav";
import arrow from "./Arrow Shoot.wav";

export const sounds = {
	/** Player tries to attack but it's not aimed at anything. */
	attackFail,

	bossGrowl,
	bossMelee,
	bossRange,

	death,
	arrow,
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
	hitBig,
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
	/** Player walking sound */
	walkLeft: [walkLeft1, walkLeft2, walkLeft3, walkLeft4, walkLeft5],
	walkRight: [walkRight1, walkRight2, walkRight3, walkRight4, walkRight5],
};

export type SoundId = keyof typeof sounds;
