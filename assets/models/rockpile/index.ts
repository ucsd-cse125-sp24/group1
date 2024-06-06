import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./rockpile.bin";
import root from "./rockpile.gltf";
export const rockpile = parseGltf(root, { "rockpile.bin": bin });
