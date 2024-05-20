import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./raw_iron.bin";
import root from "./raw_iron.gltf";
export const raw_iron = parseGltf(root, { "raw_iron.bin": bin });
