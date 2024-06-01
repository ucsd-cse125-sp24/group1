import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./mushroom cluster.bin";
import root from "./mushroom cluster.gltf";
export const mushroom_cluster = parseGltf(root, { "mushroom%20cluster.bin": bin });
