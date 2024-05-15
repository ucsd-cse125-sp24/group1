import * as fs from "node:fs/promises";
import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./sample-map-colliders.bin";
import root from "./sample-map-colliders.gltf";

export const sampleMapColliders = parseGltf(
	root,
	{
		"sample-map-colliders.bin": bin,
	},
	async (input) => {
		if (typeof input !== "string") {
			throw new TypeError("Provided a non-string input to fetch");
		}
		const filePath = new URL(input, import.meta.url);
		const buffer = await fs.readFile(filePath, { encoding: null });
		return new Response(buffer.buffer);
	},
);
