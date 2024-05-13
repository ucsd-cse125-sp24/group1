import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./sample map.bin";
import root from "./sample map.gltf";

export const sampleMap = parseGltf(root, {
	"sample%20map.bin": bin,
});
