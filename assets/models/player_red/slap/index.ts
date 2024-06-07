import { parseGltf } from "../../../../common/gltf/gltf-parser";
import bin1 from "./player_red_slap1.bin";
import bin2 from "./player_red_slap2.bin";
import bin3 from "./player_red_slap3.bin";
import root1 from "./player_red_slap1.gltf";
import root2 from "./player_red_slap2.gltf";
import root3 from "./player_red_slap3.gltf";

export const player_red_slap1 = parseGltf(root1, { "player_red_slap1.bin": bin1 });
export const player_red_slap2 = parseGltf(root2, { "player_red_slap2.bin": bin2 });
export const player_red_slap3 = parseGltf(root3, { "player_red_slap3.bin": bin3 });
