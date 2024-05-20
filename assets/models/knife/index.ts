import { parseGltf } from "../../../common/gltf/gltf-parser"; import bin from "./knife.bin"; import root from "./knife.gltf"; export const knife = parseGltf(root, { "knife.bin": bin, });
