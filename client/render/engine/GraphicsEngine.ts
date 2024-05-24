import gltfFragmentSource from "../../shaders/gltf.frag";
import gltfVertexSource from "../../shaders/gltf.vert";
import wireframeFragmentSource from "../../shaders/wireframe.frag";
import wireframeVertexSource from "../../shaders/wireframe.vert";
import particleFragmentSource from "../../shaders/particle.frag";
import particleVertexSource from "../../shaders/particle.vert";
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
	// particleMaterial = new ShaderProgram(
	// 	this,
	// 	this.createProgram(
	// 		this.createShader("vertex", particleVertexSource, "particle.vert"),
	// 		this.createShader("fragment", particleFragmentSource, "particle.frag"),
	// 		["v_position", "v_velocity", "v_age", "v_life"],
	// 	),
	// );
	models = getModels(this);

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
		}
	}
}

export default GraphicsEngine;
