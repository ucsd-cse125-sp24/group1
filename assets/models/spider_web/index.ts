import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./spider web.bin";
import root from "./spider web.gltf";
export const spider_web = parseGltf(root, { "spider%20web.bin": bin });
