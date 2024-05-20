import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./mushroom.bin";
import root from "./mushroom.gltf";
export const mushroom = parseGltf(root, { "mushroom.bin": bin });
