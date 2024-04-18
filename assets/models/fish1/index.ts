import { parseGltf } from "../../../client/model/gltf-parser";
import root from "./scene.gltf";
import bin from "./scene.bin";
import baseColor from "./textures/Full_Fish_Material_baseColor.png";
import metallicRoughness from "./textures/Full_Fish_Material_metallicRoughness.png";
import normal from "./textures/Full_Fish_Material_normal.png";

export const fish1 = parseGltf(root, {
	"scene.bin": bin,
	"textures/Full_Fish_Material_baseColor.png": baseColor,
	"textures/Full_Fish_Material_metallicRoughness.png": metallicRoughness,
	"textures/Full_Fish_Material_normal.png": normal,
});
