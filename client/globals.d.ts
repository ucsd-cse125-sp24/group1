declare module "*.vert" {
	const source: string;
	export default source;
}
declare module "*.frag" {
	const source: string;
	export default source;
}

declare const gl: WebGL2RenderingContext;
interface Window {
	gl: WebGL2RenderingContext;
}
