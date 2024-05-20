import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./shears.bin";
import root from "./shears.gltf";
export const shears = parseGltf(root, { "shears.bin": bin });
