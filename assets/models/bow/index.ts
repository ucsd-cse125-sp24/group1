import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./bow.bin";
import root from "./bow.gltf";
export const bow = parseGltf(root, { "bow.bin": bin });
