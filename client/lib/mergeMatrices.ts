import { mat4 } from "gl-matrix";

export function mergeMatrices(matrices: mat4[]): Float32Array {
	const arr = new Float32Array(matrices.length * 16);
	for (const [i, matrix] of matrices.entries()) {
		arr.set(matrix, i * 16);
	}
	return arr;
}
