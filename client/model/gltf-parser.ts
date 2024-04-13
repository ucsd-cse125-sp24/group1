type ComponentType = WebGL2RenderingContext[
	| "BYTE"
	| "UNSIGNED_BYTE"
	| "SHORT"
	| "UNSIGNED_SHORT"
	| "UNSIGNED_INT"
	| "FLOAT"];
type Gltf = {
	scenes: {
		nodes: number[];
	}[];
	scene: number;
	nodes: ({
		children: number[];
		mesh?: number;
	} & (
		| { translation?: [x: number, y: number, z: number] }
		| {
				/** A quaternion */
				rotation?: [x: number, y: number, z: number, w: number];
				scale?: [x: number, y: number, z: number];
				/** Length 16 */
				matrix?: number[];
		  }
	))[];
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
		count: number;
		bufferView: number;
		byteOffset: number;
		// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#accessor-data-types
		/** Signed ints aren't supported */
		componentType: ComponentType;
		type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
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
		min: number[];
		max: number[];
		normalized?: boolean;
	}[];
	/** May be reused */
	meshes: {
		primitives: [
			{
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
				material: number;
				mode: WebGL2RenderingContext[
					| "POINTS"
					| "LINES"
					| "LINE_LOOP"
					| "LINE_STRIP"
					| "TRIANGLES"
					| "TRIANGLE_STRIP"
					| "TRIANGLE_FAN"];
				/** Morph targets */
				targets?: ({
					POSITION?: number;
					NORMAL?: number;
					TANGENT?: number;
				} & Record<`TEXCOORD_${number}`, number> &
					Record<`COLOR_${number}`, number>)[];
			},
		];
		/** For morph targets */
		weights?: number[];
	}[];
	/** https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#skins */
	skins: unknown;
	textures: {
		sampler: number;
		source: number;
	}[];
	/**
	 * Ignore colorspace information. See Web Implementation Note at
	 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#images
	 */
	images: (
		| {
				/** May be a data URI */
				uri: string;
		  }
		| { bufferView: number; mimeType: string }
	)[];
	samplers: {
		magFilter: WebGL2RenderingContext["NEAREST" | "LINEAR"];
		minFilter: WebGL2RenderingContext[
			| "NEAREST"
			| "LINEAR"
			| "NEAREST_MIPMAP_NEAREST"
			| "LINEAR_MIPMAP_NEAREST"
			| "NEAREST_MIPMAP_LINEAR"
			| "LINEAR_MIPMAP_LINEAR"];
		wrapS: WebGL2RenderingContext["REPEAT" | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE"];
		wrapT: WebGL2RenderingContext["REPEAT" | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE"];
	}[];
	materials: {
		/**
		 * Difference between factor and texture:
		 * https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#metallic-roughness-material
		 *
		 * `index` is index of texture object.
		 */
		pbrMetallicRoughness: {
			baseColorFactor?: [r: number, g: number, b: number, a: number];
			baseColorTexture?: { index: number; texCoord?: number };
			metallicFactor?: number;
			roughnessFactor?: number;
			/** green = roughness, blue = metalness */
			metallicRoughnessTexture?: { index: number; texCoord?: number };
		};
	}[];
};
