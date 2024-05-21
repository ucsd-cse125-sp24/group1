import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./player_red.bin";
import root from "./player_red.gltf";
export const player_red = parseGltf(root, { "player_red.bin": bin });
