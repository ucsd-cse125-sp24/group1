import { parseGltf } from "../../../common/gltf/gltf-parser"; import bin from "./iron.bin"; import root from "./iron.gltf"; export const iron = parseGltf(root, { "iron.bin": bin, });
