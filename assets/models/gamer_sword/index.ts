import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./gamer sword.bin";
import root from "./gamer sword.gltf";
export const gamer_sword = parseGltf(root, { "gamer%20sword.bin": bin });
