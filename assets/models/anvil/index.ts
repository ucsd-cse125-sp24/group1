import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./anvil.bin";
import root from "./anvil.gltf";
export const anvil = parseGltf(root, { "anvil.bin": bin });
