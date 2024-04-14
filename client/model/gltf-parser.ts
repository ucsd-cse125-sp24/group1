import { mat4, quat } from "gl-matrix";
import { expect } from "../../common/lib/expect";
import { Material } from "../render/materials/Material";
import { exists } from "../../common/lib/exists";

const componentTypes = {
	[WebGL2RenderingContext.BYTE]: Int8Array,
	[WebGL2RenderingContext.UNSIGNED_BYTE]: Uint8Array,
	[WebGL2RenderingContext.SHORT]: Int16Array,
	[WebGL2RenderingContext.UNSIGNED_SHORT]: Uint16Array,
	[WebGL2RenderingContext.UNSIGNED_INT]: Uint32Array,
	[WebGL2RenderingContext.FLOAT]: Float32Array,
};
type ComponentType = keyof typeof componentTypes;

const componentSizes = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16,
};

type GltfMesh = {
	primitives: {
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
	}[];
	/** For morph targets */
	weights?: number[];
};
type GltfCamera =
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
	cameras?: GltfCamera[];
	animations?: unknown[];
};

type Node = {
	parent?: Node;
	children: Node[];
	transform: mat4;
	mesh: GltfMesh | null;
	camera: GltfCamera | null;
};
type Accessor = {
	buffer: WebGLBuffer;
	vertexAttribPointerArgs: [size: number, type: ComponentType, normalized: boolean, stride: number, offset: number];
	count: number;
};
/** A mesh is just a draw function. */
export type Mesh = () => void;

function applyTransform(node: Node, transform = mat4.create()): void {
	mat4.multiply(node.transform, node.transform, transform);
	for (const child of node.children) {
		applyTransform(child, node.transform);
	}
}
function getNodes(node: Node): Node[] {
	const nodes = node.children.flatMap(getNodes);
	nodes.push(node);
	return nodes;
}

export async function parseGltf(material: Material, root: Gltf, uriMap: Record<string, string>): Promise<Mesh[]> {
	const gl = material.engine.gl;

	const buffers = await Promise.all(
		root.buffers.map(({ uri }) =>
			fetch(uriMap[uri]).then((r) =>
				r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}: ${uri} (${r.url})`)),
			),
		),
	);
	const glBuffers = root.accessors.map((accessor): Accessor => {
		const bufferView = root.bufferViews[accessor.bufferView];
		const data = new Uint8Array(
			buffers[bufferView.buffer],
			(bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0),
			accessor.count * componentTypes[accessor.componentType].BYTES_PER_ELEMENT * componentSizes[accessor.type],
		);
		const glBuffer = gl.createBuffer() ?? expect("Failed to create buffer");
		gl.bindBuffer(bufferView.target, glBuffer);
		gl.bufferData(bufferView.target, data, gl.STATIC_DRAW);
		return {
			buffer: glBuffer,
			vertexAttribPointerArgs: [
				componentSizes[accessor.type],
				accessor.componentType,
				accessor.normalized ?? false,
				bufferView.byteStride ?? 0,
				accessor.byteOffset ?? 0,
			],
			count: accessor.count,
		};
	});

	const images = await Promise.all(
		root.images.map((image) => {
			if ("uri" in image) {
				// gl.texImage2D is much faster with ImageBitmap than HTMLImageElement
				// (380 ms to 60 ms)
				return fetch(uriMap[image.uri])
					.then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}: ${image.uri} (${r.url})`))))
					.then(createImageBitmap);
			} else {
				const bufferView = root.bufferViews[image.bufferView];
				const data = new Uint8Array(buffers[bufferView.buffer], bufferView.byteOffset, bufferView.byteLength);
				return createImageBitmap(new Blob([data], { type: image.mimeType }));
			}
		}),
	);
	const textures = root.textures.map(({ source, sampler: samplerIndex }) => {
		const image = images[source];
		const sampler = root.samplers[samplerIndex];
		const texture = gl.createTexture() ?? expect("Failed to create texture");
		gl.bindTexture(gl.TEXTURE_2D, texture);
		console.time(`uploading texture ${source}`);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		console.timeEnd(`uploading texture ${source}`);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
		gl.generateMipmap(gl.TEXTURE_2D);
		return texture;
	});

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
			mesh: node.mesh !== undefined ? root.meshes[node.mesh] : null,
			camera: node.camera !== undefined ? root.cameras?.[node.camera] ?? null : null,
		};
	});
	for (const [i, { children = [] }] of root.nodes.entries()) {
		for (const child of children) {
			nodes[i].children.push(nodes[child]);
			nodes[child].parent = nodes[i];
		}
	}

	const scene = root.scenes[root.scene].nodes.map((index) => nodes[index]).flatMap(getNodes);
	// Precompute transforms
	for (const node of scene) {
		if (!node.parent) {
			applyTransform(node);
		}
	}
	return scene
		.flatMap((node) =>
			node.mesh ? node.mesh.primitives.map((primitive) => ({ ...primitive, transform: node.transform })) : [],
		)
		.map((mesh) => {
			const materialOptions = root.materials[mesh.material];

			const vao = gl.createVertexArray() ?? expect("Failed to create VAO");
			gl.bindVertexArray(vao);

			const vbos = [
				mesh.attributes.POSITION !== undefined
					? { ...glBuffers[mesh.attributes.POSITION], attribName: "a_position" }
					: null,
				mesh.attributes.NORMAL !== undefined ? { ...glBuffers[mesh.attributes.NORMAL], attribName: "a_normal" } : null,
				mesh.attributes.TANGENT !== undefined
					? { ...glBuffers[mesh.attributes.TANGENT], attribName: "a_tangent" }
					: null,
				mesh.attributes.TEXCOORD_0 !== undefined
					? { ...glBuffers[mesh.attributes.TEXCOORD_0], attribName: "a_texcoord0" }
					: null,
				mesh.attributes.TEXCOORD_1 !== undefined
					? { ...glBuffers[mesh.attributes.TEXCOORD_1], attribName: "a_texcoord1" }
					: null,
				mesh.attributes.TEXCOORD_2 !== undefined
					? { ...glBuffers[mesh.attributes.TEXCOORD_2], attribName: "a_texcoord2" }
					: null,
			].filter(exists);
			let count = Infinity;
			for (const vbo of vbos) {
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo.buffer);
				gl.vertexAttribPointer(material.attrib(vbo.attribName), ...vbo.vertexAttribPointerArgs);
				gl.enableVertexAttribArray(material.attrib(vbo.attribName));
				if (vbo.count < count) {
					count = vbo.count;
				}
			}

			let indices: Accessor | null = null;
			if (mesh.indices) {
				indices = glBuffers[mesh.indices];
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
				count = indices.count;
			}

			const meshTextures = [
				materialOptions.pbrMetallicRoughness.baseColorTexture && {
					texture: textures[materialOptions.pbrMetallicRoughness.baseColorTexture.index],
					name: "u_texture_color",
				},
				materialOptions.pbrMetallicRoughness.metallicRoughnessTexture && {
					texture: textures[materialOptions.pbrMetallicRoughness.metallicRoughnessTexture.index],
					name: "u_texture_metallic_roughness",
				},
				materialOptions.normalTexture && {
					texture: textures[materialOptions.normalTexture.index],
					name: "u_texture_normal",
				},
				materialOptions.occlusionTexture && {
					texture: textures[materialOptions.occlusionTexture.index],
					name: "u_texture_occlusion",
				},
				materialOptions.emissiveTexture && {
					texture: textures[materialOptions.emissiveTexture.index],
					name: "u_texture_emissive",
				},
			].filter(exists);

			material.engine.checkError();

			return () => {
				// Assumes `u_model` uniform is already set
				if (materialOptions.doubleSided) {
					gl.disable(gl.CULL_FACE);
					material.engine.checkError();
				}
				for (const [i, { name, texture }] of meshTextures.entries()) {
					gl.activeTexture(gl.TEXTURE0 + i);
					material.engine.checkError();
					gl.bindTexture(gl.TEXTURE_2D, texture);
					material.engine.checkError();
					gl.uniform1i(material.uniform(name), i);
					material.engine.checkError();
				}
				gl.uniformMatrix4fv(material.uniform("u_model_part"), false, mesh.transform);
				gl.uniform1f(
					material.uniform("u_alpha_cutoff"),
					materialOptions.alphaMode === "MASK" ? materialOptions.alphaCutoff : 1,
				);
				material.engine.checkError();
				gl.bindVertexArray(vao);
				material.engine.checkError();
				if (indices) {
					gl.drawElements(mesh.mode, count, indices.vertexAttribPointerArgs[1], 0);
				} else {
					gl.drawArrays(mesh.mode, 0, count);
				}
				material.engine.checkError();
				if (materialOptions.doubleSided) {
					gl.enable(gl.CULL_FACE);
					material.engine.checkError();
				}
			};
		});
}
