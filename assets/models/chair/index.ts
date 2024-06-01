import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./chair.bin";
import root from "./chair.gltf";
export const chair = parseGltf(root, { "chair.bin": bin });
