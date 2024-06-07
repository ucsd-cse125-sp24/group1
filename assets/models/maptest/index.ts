import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./map-test.bin";
import root from "./map-test.gltf";

export const map_test = parseGltf(root, {
	"map-test.bin": bin,
});
