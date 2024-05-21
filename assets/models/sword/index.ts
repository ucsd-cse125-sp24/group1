import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./sword.bin";
import root from "./sword.gltf";
export const sword = parseGltf(root, { "sword.bin": bin });
