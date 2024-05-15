import { Trimesh } from "cannon-es";
import { vec3 } from "gl-matrix";
import { GltfParser } from "../common/gltf/gltf-parser";

/**
 * Copied from gltf-types and filled in because WebGL isn't available in the
 * Node.js environment
 */
const componentTypes = {
	5120: Int8Array,
	5121: Uint8Array,
	5122: Int16Array,
	5123: Uint16Array,
	5125: Uint32Array,
	5126: Float32Array,
};
const componentSizes = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16,
};

export function createTrimesh(model: GltfParser) {
	const { root, buffers, meshes } = model;

	// Convert model buffers into TypedArrays
	const dataBuffers = root.accessors.map((accessor) => {
		const bufferView = root.bufferViews[accessor.bufferView];
		const ArrayDataType = componentTypes[accessor.componentType];
		const length = accessor.count * componentSizes[accessor.type];
		const data = new ArrayDataType(
			buffers[bufferView.buffer],
			(bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0),
			length,
		);
		if (data.length < length) {
			throw new RangeError(
				`glTF data not big enough. Was told there'd be ${accessor.count} elements, but buffer only has ${data.length / (componentTypes[accessor.componentType].BYTES_PER_ELEMENT * componentSizes[accessor.type])} elements.`,
			);
		}
		return data;
	});

	// Join all meshes together
	const positions: number[] = [];
	const indices: number[] = [];
	for (const mesh of meshes) {
		if (mesh.attributes.POSITION === undefined || mesh.indices === undefined) {
			continue;
		}

		// Apply mesh transform to each vertex position
		const meshPositions = dataBuffers[mesh.attributes.POSITION].slice();
		for (let i = 0; i < meshPositions.length; i += 3) {
			const v = vec3.fromValues(meshPositions[i], meshPositions[i + 1], meshPositions[i + 2]);
			vec3.transformMat4(v, v, mesh.transform);
			meshPositions[i] = v[0];
			meshPositions[i + 1] = v[1];
			meshPositions[i + 2] = v[2];
		}

		// Adjust indices so we are indexing into the aggregate position array
		const startIndex = positions.length / 3;
		const meshIndices = dataBuffers[mesh.indices].map((i) => startIndex + i);

		positions.push(...meshPositions);
		indices.push(...meshIndices);
	}
	// console.log(`positions.length = ${positions.length}`);
	// console.log(`indices.length = ${indices.length}`);
	return new Trimesh(positions, indices);
}