import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./helphelphelp.bin";
import root from "./helphelphelp.gltf";
import png from "./workstation_recipes.png";
import png2 from "./anvil_recipes.png";
import furnace from "./furnace_recipes.png";
export const workstationHelp = parseGltf(root, { "helphelphelp.bin": bin, "workstation_recipes.png": png });
export const anvilHelp = parseGltf(root, { "helphelphelp.bin": bin, "workstation_recipes.png": png2 });
export const furnaceHelp = parseGltf(root, { "helphelphelp.bin": bin, "workstation_recipes.png": furnace });
