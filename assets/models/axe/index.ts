import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./axe.bin";
import root from "./axe.gltf";
export const axe = parseGltf(root, { "axe.bin": bin });
