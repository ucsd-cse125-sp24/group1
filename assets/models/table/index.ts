import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./table.bin";
import root from "./table.gltf";
export const table = parseGltf(root, { "table.bin": bin });
