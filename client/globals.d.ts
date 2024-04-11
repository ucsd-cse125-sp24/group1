/* eslint-disable no-var */

declare module "*.vert" {
	const source: string;
	export default source;
}
declare module "*.frag" {
	const source: string;
	export default source;
}

declare var gl: WebGL2RenderingContext;
