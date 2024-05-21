import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./pickaxe.bin";
import root from "./pickaxe.gltf";
export const pickaxe = parseGltf(root, { "pickaxe.bin": bin });
