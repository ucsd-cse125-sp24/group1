import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./trap.bin";
import root from "./trap.gltf";
export const trap = parseGltf(root, { "trap.bin": bin });
