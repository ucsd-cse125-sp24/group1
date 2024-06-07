import GraphicsEngine from "../../client/render/engine/GraphicsEngine";
import { Model } from "../../client/render/model/Model";
import { GltfModelWrapper } from "../../client/render/model/GltfModel";
import { donut } from "./donut";
import { fish1 } from "./fish1";
import { sampleMap } from "./sample_map";
import { samplePlayer } from "./sample_player";
import { axe } from "./axe";
import { bow } from "./bow";
import { gamer_bow } from "./gamer_bow";
import { gamer_sword } from "./gamer_sword";
import { iron } from "./iron";
import { knife } from "./knife";
import { magic_sauce } from "./magic_sauce";
import { mushroom } from "./mushroom";
import { pickaxe } from "./pickaxe";
import { player_blue } from "./player_blue";
import { player_blue_slap1, player_blue_slap2, player_blue_slap3 } from "./player_blue/slap";
import { player_green } from "./player_green";
import { player_red } from "./player_red";
import { player_yellow } from "./player_yellow";
import { raw_iron } from "./raw_iron";
import { shears } from "./shears";
import { string } from "./string";
import { sword } from "./sword";
import { wood } from "./wood";
import { furnace } from "./furnace";
import { work_station } from "./work_station";
import { table } from "./table";
import { spider_web } from "./spider_web";
import { ore_vein } from "./ore_vein";
import { mushroom_guy } from "./mushroom_guy";
import { mushroom_cluster } from "./mushroom_cluster";
import { chair } from "./chair";
import { bottle_table } from "./bottle_table";
import { anvil } from "./anvil";
import { armor } from "./armor";
import { defaultCube } from "./default-cube";
import { healthCrystal } from "./health-crystal";
import { map } from "./map";

import { trap } from "./trap";
import { rockpile } from "./rockpile";
import { gamer_armor } from "./gamer_armor";
import { minecart } from "./minecart";
import { mushroom_king } from "./mushroom_king";
import { player_green_slap1, player_green_slap2, player_green_slap3 } from "./player_green/slap";
import { player_red_slap1, player_red_slap2, player_red_slap3 } from "./player_red/slap";
import { player_yellow_slap1, player_yellow_slap2, player_yellow_slap3 } from "./player_yellow/slap";
import { player_blue_walk1, player_blue_walk2 } from "./player_blue/walk";
import { player_green_walk1, player_green_walk2 } from "./player_green/walk";
import { player_red_walk1, player_red_walk2 } from "./player_red/walk";
import { player_yellow_walk1, player_yellow_walk2 } from "./player_yellow/walk";
import { anvilHelp, furnaceHelp, workstationHelp } from "./workstation_help";
import { big_boss_hit1, big_boss_hit2 } from "./mushroom_king/hit";

export const getModels = (engine: GraphicsEngine) =>
	({
		fish1: GltfModelWrapper.from(engine.gltfMaterial, fish1),
		// fish2: GltfModelWrapper.from(engine.gltfMaterial, fish2),
		// cavecube: GltfModelWrapper.from(engine.gltfMaterial, cavecube),
		defaultCube: GltfModelWrapper.from(engine.gltfMaterial, defaultCube),
		// defaultCubeColor: GltfModelWrapper.from(engine.gltfMaterial, defaultCubeColor),
		donut: GltfModelWrapper.from(engine.gltfMaterial, donut),
		// twoTextureTest: GltfModelWrapper.from(engine.gltfMaterial, twoTextureTest),
		healthCrystal: GltfModelWrapper.from(engine.gltfMaterial, healthCrystal),
		sampleMap: GltfModelWrapper.from(engine.gltfMaterial, sampleMap),
		samplePlayer: GltfModelWrapper.from(engine.gltfMaterial, samplePlayer),
		// box1: new BoxGeometry(engine.tempMaterial, vec3.fromValues(2, 2, 2)),
		// box2: new BoxGeometry(engine.tempMaterial, vec3.fromValues(2, 2, 2)),
		axe: GltfModelWrapper.from(engine.gltfMaterial, axe),
		bow: GltfModelWrapper.from(engine.gltfMaterial, bow),
		gamer_bow: GltfModelWrapper.from(engine.gltfMaterial, gamer_bow),
		gamer_sword: GltfModelWrapper.from(engine.gltfMaterial, gamer_sword),
		iron: GltfModelWrapper.from(engine.gltfMaterial, iron),
		knife: GltfModelWrapper.from(engine.gltfMaterial, knife),
		magic_sauce: GltfModelWrapper.from(engine.gltfMaterial, magic_sauce),
		mushroom: GltfModelWrapper.from(engine.gltfMaterial, mushroom),
		pickaxe: GltfModelWrapper.from(engine.gltfMaterial, pickaxe),

		// Player Blue
		player_blue: GltfModelWrapper.from(engine.gltfMaterial, player_blue),
		player_blue_slap1: GltfModelWrapper.from(engine.gltfMaterial, player_blue_slap1),
		player_blue_slap2: GltfModelWrapper.from(engine.gltfMaterial, player_blue_slap2),
		player_blue_slap3: GltfModelWrapper.from(engine.gltfMaterial, player_blue_slap3),
		player_blue_walk1: GltfModelWrapper.from(engine.gltfMaterial, player_blue_walk1),
		player_blue_walk2: GltfModelWrapper.from(engine.gltfMaterial, player_blue_walk2),

		// Player Green
		player_green: GltfModelWrapper.from(engine.gltfMaterial, player_green),
		player_green_slap1: GltfModelWrapper.from(engine.gltfMaterial, player_green_slap1),
		player_green_slap2: GltfModelWrapper.from(engine.gltfMaterial, player_green_slap2),
		player_green_slap3: GltfModelWrapper.from(engine.gltfMaterial, player_green_slap3),
		player_green_walk1: GltfModelWrapper.from(engine.gltfMaterial, player_green_walk1),
		player_green_walk2: GltfModelWrapper.from(engine.gltfMaterial, player_green_walk2),

		player_red: GltfModelWrapper.from(engine.gltfMaterial, player_red),
		player_red_slap1: GltfModelWrapper.from(engine.gltfMaterial, player_red_slap1),
		player_red_slap2: GltfModelWrapper.from(engine.gltfMaterial, player_red_slap2),
		player_red_slap3: GltfModelWrapper.from(engine.gltfMaterial, player_red_slap3),
		player_red_walk1: GltfModelWrapper.from(engine.gltfMaterial, player_red_walk1),
		player_red_walk2: GltfModelWrapper.from(engine.gltfMaterial, player_red_walk2),

		player_yellow: GltfModelWrapper.from(engine.gltfMaterial, player_yellow),
		player_yellow_slap1: GltfModelWrapper.from(engine.gltfMaterial, player_yellow_slap1),
		player_yellow_slap2: GltfModelWrapper.from(engine.gltfMaterial, player_yellow_slap2),
		player_yellow_slap3: GltfModelWrapper.from(engine.gltfMaterial, player_yellow_slap3),
		player_yellow_walk1: GltfModelWrapper.from(engine.gltfMaterial, player_yellow_walk1),
		player_yellow_walk2: GltfModelWrapper.from(engine.gltfMaterial, player_yellow_walk2),

		raw_iron: GltfModelWrapper.from(engine.gltfMaterial, raw_iron),
		shears: GltfModelWrapper.from(engine.gltfMaterial, shears),
		string: GltfModelWrapper.from(engine.gltfMaterial, string),
		sword: GltfModelWrapper.from(engine.gltfMaterial, sword),
		wood: GltfModelWrapper.from(engine.gltfMaterial, wood),

		furnace: GltfModelWrapper.from(engine.gltfMaterial, furnace),
		work_station: GltfModelWrapper.from(engine.gltfMaterial, work_station),
		table: GltfModelWrapper.from(engine.gltfMaterial, table),
		spider_web: GltfModelWrapper.from(engine.gltfMaterial, spider_web),
		ore_vein: GltfModelWrapper.from(engine.gltfMaterial, ore_vein),
		mushroom_guy: GltfModelWrapper.from(engine.gltfMaterial, mushroom_guy),
		mushroom_cluster: GltfModelWrapper.from(engine.gltfMaterial, mushroom_cluster),
		chair: GltfModelWrapper.from(engine.gltfMaterial, chair),
		bottle_table: GltfModelWrapper.from(engine.gltfMaterial, bottle_table),
		anvil: GltfModelWrapper.from(engine.gltfMaterial, anvil),
		armor: GltfModelWrapper.from(engine.gltfMaterial, armor),
		gamer_armor: GltfModelWrapper.from(engine.gltfMaterial, gamer_armor),

		// Mushroom king
		mushroom_king: GltfModelWrapper.from(engine.gltfMaterial, mushroom_king),
		big_boss_hit1: GltfModelWrapper.from(engine.gltfMaterial, big_boss_hit1),
		big_boss_hit2: GltfModelWrapper.from(engine.gltfMaterial, big_boss_hit2),

		trap: GltfModelWrapper.from(engine.gltfMaterial, trap),

		workstationHelp: GltfModelWrapper.from(engine.gltfMaterial, workstationHelp),
		anvilHelp: GltfModelWrapper.from(engine.gltfMaterial, anvilHelp),
		furnaceHelp: GltfModelWrapper.from(engine.gltfMaterial, furnaceHelp),

		rockpile: GltfModelWrapper.from(engine.gltfMaterial, rockpile),
		minecart: GltfModelWrapper.from(engine.gltfMaterial, minecart),

		map: GltfModelWrapper.from(engine.gltfMaterial, map),
	}) satisfies Record<string, Model>;

export type ModelId = keyof ReturnType<typeof getModels>;
