import { mat4 } from "gl-matrix";

export function mergeMatrices(matrices: mat4[]): Float32Array {
	const arr = new Float32Array(matrices.length * 16);
	for (let i = 0; i < matrices.length; i++) {
		arr.set(matrices[i], i * 16);
	}
	return arr;
}

export function f32ArrayEqual(a: Float32Array, b: Float32Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}
