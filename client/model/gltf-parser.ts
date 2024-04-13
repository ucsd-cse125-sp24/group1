type Gltf = {
	scenes: {
		nodes: number[];
	}[];
	scene: number;
	nodes: {
		children: number[];
		translation?: [x: number, y: number, z: number];
		/** A quaternion */
		rotation?: [x: number, y: number, z: number, w: number];
		scale?: [x: number, y: number, z: number];
		/** Length 16 */
		matrix?: number[];
	}[];
	buffers: {
		byteLength: number;
		/** May be a data URI */
		uri: string;
	}[];
	bufferViews: {
		buffer: number;
		byteOffset: number;
		byteLength: number;
		/** For vertex attributes only */
		byteStride?: number;
		/** For vertex indices and attributes */
		target: WebGL2RenderingContext["ELEMENT_ARRAY_BUFFER" | "ARRAY_BUFFER"];
	}[];
	accessors: {
		bufferView: number;
		byteOffset: number;
		componentType: WebGL2RenderingContext[
			| "BYTE"
			| "UNSIGNED_BYTE"
			| "SHORT"
			| "UNSIGNED_SHORT"
			| "INT"
			| "UNSIGNED_INT"
			| "FLOAT"];
	}[];
};
