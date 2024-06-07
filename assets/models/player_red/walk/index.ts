import { parseGltf } from "../../../../common/gltf/gltf-parser";
import bin1 from "./player_red_walk1.bin";
import bin2 from "./player_red_walk2.bin";
import root1 from "./player_red_walk1.gltf";
import root2 from "./player_red_walk2.gltf";

export const player_red_walk1 = parseGltf(root1, { "player_red_walk1.bin": bin1 });
export const player_red_walk2 = parseGltf(root2, { "player_red_walk2.bin": bin2 });
