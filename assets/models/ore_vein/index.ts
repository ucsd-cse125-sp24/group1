import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./ore vein.bin";
import root from "./ore vein.gltf";
export const ore_vein = parseGltf(root, { "ore%20vein.bin": bin });
