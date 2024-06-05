import { parseGltf } from "../../../common/gltf/gltf-parser";
import bin from "./map-colliders.bin";
import root from "./map-colliders.gltf";

export const mapColliders = parseGltf(
	root,
	{
		"map-colliders.bin": bin,
	},
	async (input) => {
		if (typeof input !== "string") {
			throw new TypeError("Provided a non-string input to fetch");
		}
		if (BROWSER) {
			return fetch(input);
		}
		const filePath = new URL(input, import.meta.url);
		const buffer = await import("node:fs/promises").then((fs) => fs.readFile(filePath, { encoding: null }));
		return new Response(buffer.buffer);
	},
);

/**
 * Whether the server is being compiled for the browser. This is set by the
 * `esbuild` bundle options in `package.json`.
 */
declare var BROWSER: boolean;
