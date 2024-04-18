/**
 * This class, the superclass of `GraphicsEngine`, exists mostly as a hack.
 *
 * I wanted to use `this.gl` in `GraphicsEngine`'s class fields outside of the
 * constructor, but since `this.gl` is set from the constructor's parameters, it
 * has to be set in the constructor, after all the class fields evaluate.
 *
 * So to get around that, I'm using this superclass to set `this.gl` first
 * before all of `GraphicsEngine`'s class fields are evaluated. Certified
 * JavaScript moment.
 */
export class WebGlUtils {
	gl: WebGL2RenderingContext;

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
	}
}
