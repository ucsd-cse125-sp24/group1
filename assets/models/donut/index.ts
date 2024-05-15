import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./donut.bin";
import root from "./donut.gltf";
import texture from "./donut base.png";

export const donut = parseGltf(root, {
	"donut.bin": bin,
	"donut%20base.png": texture,
});
