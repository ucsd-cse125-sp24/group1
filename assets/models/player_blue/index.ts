import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./player_blue.bin";
import root from "./player_blue.gltf";
export const player_blue = parseGltf(root, { "player_blue.bin": bin });
