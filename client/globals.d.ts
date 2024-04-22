declare module "*.vert" {
	const source: string;
	export default source;
}
declare module "*.frag" {
	const source: string;
	export default source;
}

declare module "*.gltf" {
	// Importing Gltf here breaks the entire file for some reason
	const root: any;
	export default root;
}
declare module "*.bin" {
	const path: string;
	export default path;
}
declare module "*.png" {
	const path: string;
	export default path;
}

interface Element {
	// lib.dom.d.ts is missing options parameter and Promise return type
	requestPointerLock(options?: { unadjustedMovement?: boolean }): Promise<void>;
}
