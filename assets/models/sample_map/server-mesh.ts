import * as fs from "node:fs/promises";
import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./sample map.bin";
import root from "./sample map.gltf";

export const sampleMap = parseGltf(
	root,
	{
		"sample%20map.bin": bin,
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
