import { parseGltf } from "../../../../common/gltf/gltf-parser";
import bin1 from "./big_boss_hit1.bin";
import bin2 from "./big_boss_hit2.bin";
import root1 from "./big_boss_hit1.gltf";
import root2 from "./big_boss_hit2.gltf";

export const big_boss_hit1 = parseGltf(root1, { "big_boss_hit1.bin": bin1 });
export const big_boss_hit2 = parseGltf(root2, { "big_boss_hit2.bin": bin2 });
