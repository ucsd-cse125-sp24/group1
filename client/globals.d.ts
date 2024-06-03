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
declare module "*.mp3" {
	const path: string;
	export default path;
}

declare module "*.module.css" {
	const styles: Record<string, string>;
	export default styles;
}

interface Element {
	// lib.dom.d.ts is missing options parameter and Promise return type
	requestPointerLock(options?: { unadjustedMovement?: boolean }): Promise<void>;
}

// https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1615#issuecomment-1898849841
type OrientationLockType =
	| "any"
	| "landscape"
	| "landscape-primary"
	| "landscape-secondary"
	| "natural"
	| "portrait"
	| "portrait-primary"
	| "portrait-secondary";
interface ScreenOrientation extends EventTarget {
	lock(orientation: OrientationLockType): Promise<void>;
}
