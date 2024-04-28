import { vec3 } from "gl-matrix";
import GraphicsEngine from "../../client/render/engine/GraphicsEngine";
import { BoxGeometry } from "../../client/render/geometries/BoxGeometry";
import { particleGeometry } from "../../client/render/geometries/ParticleGeometry";
import { Model } from "../../client/render/model/Model";
import { GltfModelWrapper } from "../../client/render/model/gltf-parser";
import { cavecube } from "./cavecube";
import { defaultCube } from "./default-cube";
import { defaultCubeColor } from "./default-cube-color";
import { donut } from "./donut";
import { fish1 } from "./fish1";
import { fish2 } from "./fish2";
import { twoTextureTest } from "./two-texture-test";
import { sampleMap } from "./sample_map";
import { samplePlayer } from "./sample_player";

export const getModels = (engine: GraphicsEngine) =>
	({
		fish1: GltfModelWrapper.from(engine.gltfMaterial, fish1),
		fish2: GltfModelWrapper.from(engine.gltfMaterial, fish2),
		cavecube: GltfModelWrapper.from(engine.gltfMaterial, cavecube),
		defaultCube: GltfModelWrapper.from(engine.gltfMaterial, defaultCube),
		defaultCubeColor: GltfModelWrapper.from(engine.gltfMaterial, defaultCubeColor),
		donut: GltfModelWrapper.from(engine.gltfMaterial, donut),
		twoTextureTest: GltfModelWrapper.from(engine.gltfMaterial, twoTextureTest),
		sampleMap: GltfModelWrapper.from(engine.gltfMaterial, sampleMap),
		samplePlayer: GltfModelWrapper.from(engine.gltfMaterial, samplePlayer),
		box1: new BoxGeometry(engine.tempMaterial, vec3.fromValues(2, 2, 2)),
		box2: new BoxGeometry(engine.tempMaterial, vec3.fromValues(2, 2, 2)),
		box3: new particleGeometry(engine.particleMaterial, vec3.fromValues(1, 2, 3)),
	}) satisfies Record<string, Model>;

export type ModelId = keyof ReturnType<typeof getModels>;
