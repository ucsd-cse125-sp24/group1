import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./cavecube.bin";
import root from "./cavecube.gltf";

export const cavecube = parseGltf(root, {
	"cavecube.bin": bin,
});
