import { mat4, quat } from "gl-matrix";
import { expect } from "../../common/lib/expect";

type ComponentType = WebGL2RenderingContext[
	| "BYTE"
	| "UNSIGNED_BYTE"
	| "SHORT"
	| "UNSIGNED_SHORT"
	| "UNSIGNED_INT"
	| "FLOAT"];
function componentTypeToTypedArray(type: ComponentType) {
	switch (type) {
		case WebGL2RenderingContext.BYTE:
			return Int8Array;
		case WebGL2RenderingContext.UNSIGNED_BYTE:
			return Uint8Array;
		case WebGL2RenderingContext.SHORT:
			return Int16Array;
		case WebGL2RenderingContext.UNSIGNED_SHORT:
			return Uint16Array;
		case WebGL2RenderingContext.UNSIGNED_INT:
			return Uint32Array;
		case WebGL2RenderingContext.FLOAT:
			return Float32Array;
	}
}

const componentSizes = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16,
};

type Gltf = {
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
	skins?: unknown[];
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
	materials: ({
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
		normalTexture?: { index: number; texCoord?: number; scale?: number };
		occlusionTexture?: { index: number; texCoord?: number; strength?: number };
		emissiveTexture?: { index: number; texCoord?: number };
		emissiveFactor?: [r: number, g: number, b: number];
		doubleSided?: boolean;
	} & ({ alphaMode: "MASK"; alphaCutoff: number } | { alphaMode?: "OPAQUE" | "BLEND" }))[];
	cameras: (
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
		  }
	)[];
	animations?: unknown[];
};

type Node = {
	children: Node[];
	transform: mat4;
};
type Accessor = {
	buffer: WebGLBuffer;
	vertexAttribPointerArgs: [size: number, type: number, normalized: boolean, stride: number, offset: number];
};

export async function parseGltf(gl: WebGL2RenderingContext, root: Gltf) {
	const nodes = root.nodes.map((node): Node => {
		return {
			children: [],
			transform:
				"matrix" in node
					? mat4.fromValues(...node.matrix)
					: mat4.fromRotationTranslationScale(
							mat4.create(),
							node.rotation ? quat.fromValues(...node.rotation) : quat.create(),
							node.translation ?? [0, 0, 0],
							node.scale ?? [1, 1, 1],
						),
		};
	});
	for (const [i, { children = [] }] of root.nodes.entries()) {
		for (const child of children) {
			nodes[i].children.push(nodes[child]);
		}
	}

	const buffers = await Promise.all(
		root.buffers.map(({ uri }) =>
			fetch(uri).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}: ${uri}`)))),
		),
	);
	const glBuffers = root.accessors.map((accessor): Accessor => {
		const bufferView = root.bufferViews[accessor.bufferView];
		const data = new Uint8Array(
			buffers[bufferView.buffer],
			bufferView.byteOffset + (accessor.byteOffset ?? 0),
			accessor.count *
				componentTypeToTypedArray(accessor.componentType).BYTES_PER_ELEMENT *
				componentSizes[accessor.type],
		);
		const glBuffer = gl.createBuffer() ?? expect("Failed to create buffer");
		gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		return {
			buffer: glBuffer,
			vertexAttribPointerArgs: [
				componentSizes[accessor.type],
				accessor.componentType,
				accessor.normalized ?? false,
				bufferView.byteStride ?? 0,
				bufferView.byteOffset,
			],
		};
	});

	const scene = root.scenes[root.scene];
}
