import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./work station.bin";
import root from "./work station.gltf";
export const work_station = parseGltf(root, { "work%20station.bin": bin });
