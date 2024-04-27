import { parseGltf } from "../../../client/render/model/gltf-parser";
import bin from "./untitled.bin";
import root from "./untitled.gltf";

export const defaultCube = parseGltf(root, {
	"untitled.bin": bin,
});
