import { parseGltf } from "../../../client/model/gltf-parser";
import { Material } from "../../../client/render/materials/Material";
import root from "./fish.gltf";
import bin from "./fish.bin";
import fins from "./fins.png";
import finsfins from "./finsfins.png";
import fishTexture from "./fish texture.png";

export const fish2 = (material: Material) =>
	parseGltf(material, root, {
		"fish.bin": bin,
		"fins.png": fins,
		"finsfins.png": finsfins,
		"fish%20texture.png": fishTexture,
	});
