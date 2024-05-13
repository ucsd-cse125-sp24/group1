import { parseGltf } from "../../../common/gltf/gltf-parser";
import fins from "./fins.png";
import finsfins from "./finsfins.png";
import fishTexture from "./fish texture.png";
import bin from "./fish.bin";
import root from "./fish.gltf";

export const fish2 = parseGltf(root, {
	"fish.bin": bin,
	"fins.png": fins,
	"finsfins.png": finsfins,
	"fish%20texture.png": fishTexture,
});
