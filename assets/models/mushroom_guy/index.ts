import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./mushroom guy.bin";
import root from "./mushroom guy.gltf";
export const mushroom_guy = parseGltf(root, { "mushroom%20guy.bin": bin });
