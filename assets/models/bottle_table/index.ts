import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./bottle table.bin";
import root from "./bottle table.gltf";
export const bottle_table = parseGltf(root, { "bottle%20table.bin": bin });
