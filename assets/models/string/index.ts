import { parseGltf } from "../../../common/gltf/gltf-parser"; import bin from "./string.bin"; import root from "./string.gltf"; export const string = parseGltf(root, { "string.bin": bin, });
