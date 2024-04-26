import { mat4, quat } from "gl-matrix";
import { exists } from "../../../common/lib/exists";
import { expect } from "../../../common/lib/expect";
import { ShaderProgram } from "../engine/ShaderProgram";
import {
	ComponentType,
	Gltf,
	GltfCamera,
	GltfMaterial,
	GltfMesh,
	GltfMode,
	GltfPrimitive,
	componentSizes,
	componentTypes,
} from "./gltf-types";

type Node = {
	parent?: Node;
	children: Node[];
	transform: mat4;
	mesh: GltfMesh | null;
	camera: GltfCamera | null;
};

/**
 * Converts local to global transformations for all nodes in the tree,
 * multiplying each child node's local transformation matrix by their
 * ancestors'. This way, the tree of nodes can be flattened into a single list.
 */
function applyTransform(node: Node, transform = mat4.create()): void {
	mat4.multiply(node.transform, node.transform, transform);
	for (const child of node.children) {
		applyTransform(child, node.transform);
	}
}
/**
 * Flatten a tree of nodes into a list of nodes.
 */
function getNodes(node: Node): Node[] {
	const nodes = node.children.flatMap(getNodes);
	nodes.push(node);
	return nodes;
}

export type GltfParser = {
	root: Gltf;
	buffers: ArrayBuffer[];
	images: ImageBitmap[];
	meshes: (GltfPrimitive & { transform: mat4 })[];
};

export async function parseGltf(root: Gltf, uriMap: Record<string, string>): Promise<GltfParser> {
	const buffers = await Promise.all(
		root.buffers.map(({ uri }) =>
			fetch(uriMap[uri]).then((r) =>
				r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}: ${uri} (${r.url})`)),
			),
		),
	);

	const images = await Promise.all(
		root.images.map((image) => {
			if ("uri" in image) {
				// gl.texImage2D is much faster with ImageBitmap than
				// HTMLImageElement (380 ms to 60 ms)
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

	return {
		root,
		buffers,
		images,
		meshes: scene.flatMap((node) =>
			node.mesh ? node.mesh.primitives.map((primitive) => ({ ...primitive, transform: node.transform })) : [],
		),
	};
}

type Accessor = {
	buffer: WebGLBuffer;
	vertexAttribPointerArgs: [size: number, type: ComponentType, normalized: boolean, stride: number, offset: number];
	count: number;
};

type ModelMesh = {
	vao: WebGLVertexArrayObject;
	materialOptions: GltfMaterial;
	meshTextures: { texture: WebGLTexture; name: string }[];
	indices: Accessor | null;
	count: number;
	transform: mat4;
	mode?: GltfMode;
};

export class GltfModel {
	#material: ShaderProgram;
	#meshes: ModelMesh[];

	constructor(material: ShaderProgram, { root, buffers, images, meshes }: GltfParser) {
		this.#material = material;

		const gl = material.engine.gl;

		const glBuffers = root.accessors.map((accessor): Accessor => {
			const bufferView = root.bufferViews[accessor.bufferView];
			const data = new Uint8Array(
				buffers[bufferView.buffer],
				(bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0),
				accessor.count * componentTypes[accessor.componentType].BYTES_PER_ELEMENT * componentSizes[accessor.type],
			);
			const buffer = gl.createBuffer() ?? expect("Failed to create buffer");
			gl.bindBuffer(bufferView.target, buffer);
			gl.bufferData(bufferView.target, data, gl.STATIC_DRAW);
			return {
				buffer,
				vertexAttribPointerArgs: [
					componentSizes[accessor.type],
					accessor.componentType,
					accessor.normalized ?? false,
					bufferView.byteStride ?? 0,
					0,
				],
				count: accessor.count,
			};
		});

		const textures = root.textures.map(({ source, sampler: samplerIndex }) => {
			const image = images[source];
			const sampler = root.samplers[samplerIndex];
			const texture = gl.createTexture() ?? expect("Failed to create texture");
			gl.bindTexture(gl.TEXTURE_2D, texture);
			console.time(`uploading texture ${source}`);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			console.timeEnd(`uploading texture ${source}`);
			if (sampler.wrapS) {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
			}
			if (sampler.wrapT) {
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
			}
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
			gl.generateMipmap(gl.TEXTURE_2D);
			return texture;
		});

		this.#meshes = meshes.map((mesh) => {
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
					name: "texture_color",
				},
				materialOptions.pbrMetallicRoughness.metallicRoughnessTexture && {
					texture: textures[materialOptions.pbrMetallicRoughness.metallicRoughnessTexture.index],
					name: "texture_metallic_roughness",
				},
				materialOptions.normalTexture && {
					texture: textures[materialOptions.normalTexture.index],
					name: "texture_normal",
				},
				materialOptions.occlusionTexture && {
					texture: textures[materialOptions.occlusionTexture.index],
					name: "texture_occlusion",
				},
				materialOptions.emissiveTexture && {
					texture: textures[materialOptions.emissiveTexture.index],
					name: "texture_emissive",
				},
			].filter(exists);

			material.engine.checkError();

			return {
				vao,
				materialOptions,
				meshTextures,
				indices,
				count,
				transform: mesh.transform,
				mode: mesh.mode,
			};
		});
	}

	draw() {
		const material = this.#material;
		const gl = material.engine.gl;

		for (const { vao, materialOptions, meshTextures, indices, count, transform, mode } of this.#meshes) {
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
				gl.uniform1i(material.uniform(`u_${name}`), i);
				gl.uniform1i(material.uniform(`u_has_${name}`), 1);
				material.engine.checkError();
			}
			gl.uniformMatrix4fv(material.uniform("u_model_part"), false, transform);
			gl.uniform1f(
				material.uniform("u_alpha_cutoff"),
				materialOptions.alphaMode === "MASK" ? materialOptions.alphaCutoff : 1,
			);
			gl.uniform4fv(
				material.uniform("u_base_color"),
				materialOptions.pbrMetallicRoughness.baseColorFactor ?? [1, 1, 1, 1],
			);
			gl.uniform1f(material.uniform("u_metallic"), materialOptions.pbrMetallicRoughness.metallicFactor ?? 1);
			gl.uniform1f(material.uniform("u_roughness"), materialOptions.pbrMetallicRoughness.roughnessFactor ?? 1);
			gl.uniform3fv(material.uniform("u_emissive"), materialOptions.emissiveFactor ?? [0, 0, 0]);
			material.engine.checkError();
			gl.bindVertexArray(vao);
			material.engine.checkError();
			if (indices) {
				gl.drawElements(mode ?? gl.TRIANGLES, count, indices.vertexAttribPointerArgs[1], 0);
			} else {
				gl.drawArrays(mode ?? gl.TRIANGLES, 0, count);
			}
			material.engine.checkError();
			if (materialOptions.doubleSided) {
				gl.enable(gl.CULL_FACE);
				material.engine.checkError();
			}
		}
	}
}

export class GltfModelWrapper {
	#model: GltfModel | null = null;

	constructor(material: ShaderProgram, promise: Promise<GltfParser>) {
		promise.then((model) => {
			this.#model = new GltfModel(material, model);
		});
	}

	draw() {
		this.#model?.draw();
	}

	static from(material: ShaderProgram, promise: Promise<GltfParser>): GltfModelWrapper {
		return new GltfModelWrapper(material, promise);
	}
}