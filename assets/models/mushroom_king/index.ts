import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./mushroom king.bin";
import root from "./mushroom king.gltf";
export const mushroom_king = parseGltf(root, { "mushroom%20king.bin": bin });
