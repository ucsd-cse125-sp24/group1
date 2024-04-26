import basicFragmentSource from "../../shaders/basic.frag";
import basicVertexSource from "../../shaders/basic.vert";
import gltfFragmentSource from "../../shaders/gltf.frag";
import gltfVertexSource from "../../shaders/gltf.vert";
import wireframeFragmentSource from "../../shaders/wireframe.frag";
import wireframeVertexSource from "../../shaders/wireframe.vert";
import toonShaderSouce from "../../shaders/toon.frag";
import toonShaderSouce2 from "../../shaders/toon2.frag";
import { WebGlUtils } from "./WebGlUtils";
import { BoxGeometry } from "../geometries/BoxGeometry";
import { HardCodedGeometry } from "../geometries/HardCodedGeometry";
import { ShaderProgram } from "./ShaderProgram";
import particleFragmentSource from "../shaders/particle.frag";
import particleVertexSource from "../shaders/particle.vert";

/**
 * Handles helper functions for interacting with WebGL.
 */
class GraphicsEngine extends WebGlUtils {
	tempMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", basicVertexSource, "basic.vert"),
			this.createShader("fragment", toonShaderSouce2, "toon2.frag"),
		),
	);
	tempGeometry = new BoxGeometry(this.tempMaterial, [1, 1, 1]);
	wireframeMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", wireframeVertexSource, "wireframe.vert"),
			this.createShader("fragment", wireframeFragmentSource, "wireframe.frag"),
		),
	);
	wireframeGeometry = new HardCodedGeometry(this.wireframeMaterial);
	gltfMaterial = new ShaderProgram(
		this,
		this.createProgram(
			this.createShader("vertex", gltfVertexSource, "gltf.vert"),
			this.createShader("fragment", gltfFragmentSource, "gltf.frag"),
		),
	);

	particleMaterial = new ShaderProgram(
		this, this.createProgram(
		this.createShader("vertex", particleVertexSource, "particle.vert"),
		this.createShader("fragment", particleFragmentSource, "particle.frag"),
		["v_position", "v_velocity", "v_age", "v_life"])
	);
}

export default GraphicsEngine;