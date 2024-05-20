import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./wood.bin";
import root from "./wood.gltf";
export const wood = parseGltf(root, { "wood.bin": bin });
