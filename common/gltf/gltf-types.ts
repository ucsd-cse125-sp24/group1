// Defines TypeScript types to represent glTF's JSON structure

export const componentTypes = {
	[WebGL2RenderingContext.BYTE]: Int8Array,
	[WebGL2RenderingContext.UNSIGNED_BYTE]: Uint8Array,
	[WebGL2RenderingContext.SHORT]: Int16Array,
	[WebGL2RenderingContext.UNSIGNED_SHORT]: Uint16Array,
	[WebGL2RenderingContext.UNSIGNED_INT]: Uint32Array,
	[WebGL2RenderingContext.FLOAT]: Float32Array,
};
export type ComponentType = keyof typeof componentTypes;

export const componentSizes = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16,
};

export type GltfMode = WebGL2RenderingContext[
	| "POINTS"
	| "LINES"
	| "LINE_LOOP"
	| "LINE_STRIP"
	| "TRIANGLES"
	| "TRIANGLE_STRIP"
	| "TRIANGLE_FAN"];
export type GltfPrimitive = {
	/**
	 * Values are the index of accessor. Numbers start at 0 (eg `TEXCOORD_0`)
	 *
	 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes-overview
	 */
	attributes: {
		POSITION?: number;
		NORMAL?: number;
		TANGENT?: number;
	} & Record<`TEXCOORD_${number}`, number> &
		Record<`COLOR_${number}`, number> &
		Record<`JOINTS_${number}`, number> &
		Record<`WEIGHTS_${number}`, number>;
	/** Accessor of indices */
	indices?: number;
	material?: number;
	mode?: GltfMode;
	/** Morph targets */
	targets?: ({
		POSITION?: number;
		NORMAL?: number;
		TANGENT?: number;
	} & Record<`TEXCOORD_${number}`, number> &
		Record<`COLOR_${number}`, number>)[];
};
export type GltfMesh = {
	name?: string;
	primitives: GltfPrimitive[];
	/** For morph targets */
	weights?: number[];
};
export type GltfMaterial = {
	/**
	 * Difference between factor and texture:
	 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metallic-roughness-material
	 *
	 * `index` is index of texture object.
	 */
	pbrMetallicRoughness?: {
		baseColorFactor?: [r: number, g: number, b: number, a: number];
		baseColorTexture?: { index: number; texCoord?: number };
		metallicFactor?: number;
		roughnessFactor?: number;
		/** green = roughness, blue = metalness */
		metallicRoughnessTexture?: { index: number; texCoord?: number };
	};
	normalTexture?: { index: number; texCoord?: number; scale?: number };
	occlusionTexture?: { index: number; texCoord?: number; strength?: number };
	emissiveTexture?: { index: number; texCoord?: number };
	emissiveFactor?: [r: number, g: number, b: number];
	doubleSided?: boolean;
} & ({ alphaMode: "MASK"; alphaCutoff: number } | { alphaMode?: "OPAQUE" | "BLEND" });
export type GltfCamera =
	| {
			type: "perspective";
			perspective: {
				aspectRatio: number;
				yfov: number;
				zfar?: number;
				znear: number;
			};
	  }
	| {
			type: "orthographic";
			orthographic: {
				xmag: number;
				ymag: number;
				zfar: number;
				znear: number;
			};
	  };
export type Gltf = {
	scenes: {
		nodes: number[];
	}[];
	scene: number;
	nodes: ({
		children?: number[];
		mesh?: number;
		camera?: number;
	} & (
		| {
				translation?: [x: number, y: number, z: number];
				/** A quaternion */
				rotation?: [x: number, y: number, z: number, w: number];
				scale?: [x: number, y: number, z: number];
		  }
		| {
				/** Length 16 */
				matrix: [
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
				];
		  }
	))[];
	buffers: {
		byteLength: number;
		/** May be a data URI */
		uri: string;
	}[];
	bufferViews: {
		buffer: number;
		byteOffset?: number;
		byteLength: number;
		/** For vertex attributes only */
		byteStride?: number;
		/** For vertex indices and attributes */
		target: WebGL2RenderingContext["ELEMENT_ARRAY_BUFFER" | "ARRAY_BUFFER"];
	}[];
	accessors: {
		count: number;
		bufferView: number;
		byteOffset?: number;
		// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#accessor-data-types
		/** Signed ints aren't supported */
		componentType: ComponentType;
		type: keyof typeof componentSizes;
		sparse?: {
			count: number;
			indices: {
				bufferView: number;
				byteOffset: number;
				componentType: ComponentType;
			};
			values: {
				bufferView: number;
				byteOffset: number;
			};
		};
		min?: number[];
		max?: number[];
		normalized?: boolean;
	}[];
	/** May be reused */
	meshes: GltfMesh[];
	/** https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#skins */
	skins?: unknown[];
	textures?: {
		sampler: number;
		source: number;
	}[];
	/**
	 * Ignore colorspace information. See Web Implementation Note at
	 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images
	 */
	images?: (
		| {
				/** May be a data URI */
				uri: string;
		  }
		| { bufferView: number; mimeType: string }
	)[];
	samplers?: {
		magFilter: WebGL2RenderingContext["NEAREST" | "LINEAR"];
		minFilter: WebGL2RenderingContext[
			| "NEAREST"
			| "LINEAR"
			| "NEAREST_MIPMAP_NEAREST"
			| "LINEAR_MIPMAP_NEAREST"
			| "NEAREST_MIPMAP_LINEAR"
			| "LINEAR_MIPMAP_LINEAR"];
		wrapS?: WebGL2RenderingContext["REPEAT" | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE"];
		wrapT?: WebGL2RenderingContext["REPEAT" | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE"];
	}[];
	materials?: GltfMaterial[];
	cameras?: GltfCamera[];
	animations?: unknown[];
};
