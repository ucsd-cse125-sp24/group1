import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./sample player.bin";
import root from "./sample player.gltf";

export const samplePlayer = parseGltf(root, {
	"sample%20player.bin": bin,
});
