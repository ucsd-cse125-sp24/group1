import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./furnace.bin";
import root from "./furnace.gltf";
export const furnace = parseGltf(root, { "furnace.bin": bin });
