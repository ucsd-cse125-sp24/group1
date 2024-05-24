import { vec3 } from "gl-matrix";
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
import { player_green } from "./player_green";
import { player_red } from "./player_red";
import { player_yellow } from "./player_yellow";
import { raw_iron } from "./raw_iron";
import { shears } from "./shears";
import { string } from "./string";
import { sword } from "./sword";
import { wood } from "./wood";
import { defaultCube } from "./default-cube";

export const getModels = (engine: GraphicsEngine) =>
	({
		fish1: GltfModelWrapper.from(engine.gltfMaterial, fish1),
		// fish2: GltfModelWrapper.from(engine.gltfMaterial, fish2),
		// cavecube: GltfModelWrapper.from(engine.gltfMaterial, cavecube),
		defaultCube: GltfModelWrapper.from(engine.gltfMaterial, defaultCube),
		// defaultCubeColor: GltfModelWrapper.from(engine.gltfMaterial, defaultCubeColor),
		donut: GltfModelWrapper.from(engine.gltfMaterial, donut),
		// twoTextureTest: GltfModelWrapper.from(engine.gltfMaterial, twoTextureTest),
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
		player_blue: GltfModelWrapper.from(engine.gltfMaterial, player_blue),
		player_green: GltfModelWrapper.from(engine.gltfMaterial, player_green),
		player_red: GltfModelWrapper.from(engine.gltfMaterial, player_red),
		player_yellow: GltfModelWrapper.from(engine.gltfMaterial, player_yellow),
		raw_iron: GltfModelWrapper.from(engine.gltfMaterial, raw_iron),
		shears: GltfModelWrapper.from(engine.gltfMaterial, shears),
		string: GltfModelWrapper.from(engine.gltfMaterial, string),
		sword: GltfModelWrapper.from(engine.gltfMaterial, sword),
		wood: GltfModelWrapper.from(engine.gltfMaterial, wood),
	}) satisfies Record<string, Model>;

export type ModelId = keyof ReturnType<typeof getModels>;
