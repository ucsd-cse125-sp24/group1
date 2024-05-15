import * as phys from "cannon-es";
import { mat4, quat, vec3 } from "gl-matrix";
import { GltfParser } from "../../../common/gltf/gltf-parser";
import { exists } from "../../../common/lib/exists";

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

export type MapCollider = {
	shape: phys.Shape;
	offset: phys.Vec3;
	rotation: phys.Quaternion;
};

export function getColliders(model: GltfParser): MapCollider[] {
	return model.meshes
		.map((mesh): MapCollider | null => {
			if (!mesh.name) {
				return null;
			}
			const scaling = mat4.getScaling(vec3.create(), mesh.transform);
			// In order to get a correct unit-length quaternion, need to remove the
			// scaling from the transform matrix
			const rotation = mat4.getRotation(
				quat.create(),
				mat4.scale(mat4.create(), mesh.transform, vec3.inverse(vec3.create(), scaling)),
			);
			const translation = mat4.getTranslation(vec3.create(), mesh.transform);
			let box: phys.Box;
			if (mesh.name.includes("Cube")) {
				// Default Blender cube is 2x2x2
				box = new phys.Box(new phys.Vec3(...scaling));
			} else if (mesh.name.includes("Plane")) {
				// Default Blender plane is 2x2
				// Turn into thin box with volume below the original plane (like
				// extruding in direction opposite to normal)
				const halfThickness = 0.1;
				box = new phys.Box(new phys.Vec3(scaling[0], halfThickness, scaling[2]));
				// Adjust translation to compensate for new center
				const normal = vec3.transformQuat(vec3.create(), vec3.fromValues(0, 1, 0), rotation);
				vec3.scale(normal, normal, halfThickness);
				vec3.subtract(translation, translation, normal);
			} else {
				return null;
			}
			return {
				shape: box,
				offset: new phys.Vec3(...translation),
				rotation: new phys.Quaternion(...rotation),
			};
		})
		.filter(exists);
}

/**
 * Currently unused
 */
export function createTrimesh(model: GltfParser): phys.Trimesh {
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
	return new phys.Trimesh(positions, indices);
}
