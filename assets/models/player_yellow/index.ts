import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./player_yellow.bin";
import root from "./player_yellow.gltf";
export const player_yellow = parseGltf(root, { "player_yellow.bin": bin });
