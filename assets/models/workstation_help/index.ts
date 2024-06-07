import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./helphelphelp.bin";
import root from "./helphelphelp.gltf";
import png from "./workstation_recipes.png";
export const workstationHelp = parseGltf(root, { "helphelphelp.bin": bin, "workstation_recipes.png": png });
