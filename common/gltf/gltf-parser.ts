import { mat4, quat } from "gl-matrix";
import { Gltf, GltfCamera, GltfMesh, GltfPrimitive } from "./gltf-types";

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
		root.images?.map((image) => {
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
		}) ?? [],
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
