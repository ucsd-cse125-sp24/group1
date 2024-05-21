import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./gamer bow.bin";
import root from "./gamer bow.gltf";
export const gamer_bow = parseGltf(root, { "gamer%20bow.bin": bin });
