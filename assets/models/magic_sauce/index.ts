import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./magic sauce.bin";
import root from "./magic sauce.gltf";
export const magic_sauce = parseGltf(root, { "magic%20sauce.bin": bin });
