import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./gamer armor.bin";
import root from "./gamer armor.gltf";
export const gamer_armor = parseGltf(root, { "gamer%20armor.bin": bin });
