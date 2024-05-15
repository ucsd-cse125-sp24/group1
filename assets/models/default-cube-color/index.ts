import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./untitled.bin";
import root from "./untitled.gltf";

export const defaultCubeColor = parseGltf(root, {
	"untitled.bin": bin,
});
