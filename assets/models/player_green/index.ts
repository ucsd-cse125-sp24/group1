import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./player_green.bin";
import root from "./player_green.gltf";
export const player_green = parseGltf(root, { "player_green.bin": bin });
