import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./map.bin";
import root from "./map.gltf";

export const map = parseGltf(root, {
	"map.bin": bin,
});
