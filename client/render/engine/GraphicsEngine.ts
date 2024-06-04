import gltfFragmentSource from "../../shaders/gltf.frag";
import gltfVertexSource from "../../shaders/gltf.vert";
import textFragmentSource from "../../shaders/text.frag";
import textVertexSource from "../../shaders/text.vert";
import wireframeFragmentSource from "../../shaders/wireframe.frag";
import wireframeVertexSource from "../../shaders/wireframe.vert";
import { getModels } from "../../../assets/models";
import { SerializedCollider } from "../../../common/messages";
import { ShaderProgram } from "./ShaderProgram";
import { WebGlUtils } from "./WebGlUtils";

/**
 * Handles helper functions for interacting with WebGL.
 */
class GraphicsEngine extends WebGlUtils {
	wireframeMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", wireframeVertexSource, "wireframe.vert"),
			this.createShader("fragment", wireframeFragmentSource, "wireframe.frag"),
		),
	);
	gltfMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", gltfVertexSource, "gltf.vert"),
			this.createShader("fragment", gltfFragmentSource, "gltf.frag"),
		),
	);
	textMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", textVertexSource, "text.vert"),
			this.createShader("fragment", textFragmentSource, "text.frag"),
		),
	);
	models = getModels(this);

	_drawCalls = 0;

	/**
	 * Draws a wireframe.
	 *
	 * Preconditions:
	 * - The shader program is in use.
	 * - `u_view` and `u_model` are set.
	 */
	drawWireframe(collider: SerializedCollider): void {
		if (collider.type === "box") {
			this.gl.uniform1i(this.wireframeMaterial.uniform("u_shape"), 1);
			this.gl.uniform4f(this.wireframeMaterial.uniform("u_size"), ...collider.size, 0);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
		} else if (collider.type === "plane") {
			this.gl.uniform1i(this.wireframeMaterial.uniform("u_shape"), 2);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
		} else if (collider.type === "sphere") {
			this.gl.uniform1i(this.wireframeMaterial.uniform("u_shape"), 3);
			this.gl.uniform4f(this.wireframeMaterial.uniform("u_size"), collider.radius, collider.radius, collider.radius, 0);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 18);
		} else if (collider.type === "cylinder") {
			this.gl.uniform1i(this.wireframeMaterial.uniform("u_shape"), 4);
			this.gl.uniform4f(
				this.wireframeMaterial.uniform("u_size"),
				collider.radiusTop,
				collider.radiusBottom,
				collider.height / 2,
				(2 * Math.PI) / collider.numSegments,
			);
			this.gl.drawArrays(this.gl.TRIANGLES, 0, 12 + 6 * collider.numSegments);
		} else {
			return;
		}
		this._drawCalls++;
	}
}

export default GraphicsEngine;
