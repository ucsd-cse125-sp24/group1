import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./armor.bin";
import root from "./armor.gltf";
export const armor = parseGltf(root, { "armor.bin": bin });
