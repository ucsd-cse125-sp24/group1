import { parseGltf } from "../../../client/render/model/gltf-parser";
import color from "./bruh.png";
import roughness from "./ruffness2.png";
import bin from "./shiny-eyes-monkey.bin";
import root from "./shiny-eyes-monkey.gltf";

export const twoTextureTest = parseGltf(root, {
	"shiny-eyes-monkey.bin": bin,
	"bruh.png": color,
	"ruffness2.png": roughness,
});
