import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./health-crystal.bin";
import root from "./health-crystal.gltf";

export const healthCrystal = parseGltf(root, {
	"health-crystal.bin": bin,
});
