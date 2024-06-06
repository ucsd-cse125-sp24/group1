import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./minecart.bin";
import root from "./minecart.gltf";
export const minecart = parseGltf(root, { "minecart.bin": bin });
