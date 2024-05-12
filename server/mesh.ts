import { Trimesh } from "cannon-es";
import { GltfParser } from "../common/gltf/gltf-parser";

export async function createTrimesh(model: Promise<GltfParser>) {
	// Extract positions and indices from the model
	const { buffers, meshes } = await model;
	const mesh = meshes[0];
	const positionIndex = mesh.attributes.POSITION;
	if (positionIndex === undefined) {
		throw new Error("Model doesn't contain position attribute");
	}
	const indicesIndex = mesh.indices;
	if (indicesIndex === undefined) {
		throw new Error("Model doesn't contain indices");
	}
	const positions = new Float32Array(buffers[positionIndex]);
	const indices = new Uint8Array(buffers[indicesIndex]);
	// Return a Trimesh with the data
	return new Trimesh(Array.from(positions), Array.from(indices));
}
