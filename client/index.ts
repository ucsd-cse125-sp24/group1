import { mat4, vec3 } from "gl-matrix";
import { SERVER_GAME_TICK } from "../common/constants";
import { ClientMessage, SerializedCollider, ServerMessage } from "../common/messages";
import "./index.css";
import { listenErrors } from "./lib/listenErrors";
import { Connection } from "./net/Connection";
import { InputListener } from "./net/InputListener";
import { FreecamInputs, PlayerCamera } from "./render/camera/PlayerCamera";
import { ClientEntity } from "./render/ClientEntity";
import GraphicsEngine from "./render/engine/GraphicsEngine";
import { getGl } from "./render/getGl";
import { PointLight } from "./render/lights/PointLight";
import { RenderPipeline } from "./render/engine/RenderPipeline";
import { ShaderProgram } from "./render/engine/ShaderProgram";
import filterVertexSource from "./shaders/filter.vert";
import outlineFilterFragmentSource from "./shaders/outlineFilter.frag";
import { TempLightModel } from "./render/lights/TempLightModel";
import tempLightVertexSource from "./shaders/temp_light.vert";
import tempLightFragmentSource from "./shaders/temp_light.frag";
import { TempLightEntity } from "./render/lights/TempLightEntity";

const errorWindow = document.getElementById("error-window");
if (errorWindow instanceof HTMLDialogElement) {
	listenErrors(errorWindow);
} else {
	alert("Failed to get error window");
}

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");

let entities: ClientEntity[] = [];
let colliders: { collider: SerializedCollider; transform: mat4 }[] = [];
let cameraLockTarget: string | null = null;
let isFirstPerson: boolean = true;
let freecam: boolean = false; // for debug purposes
/**
 * Wireframe mode, for debug purposes.
 * - 0: hide wireframe
 * - 1: show wireframe, use depth buffer
 * - 2: show wireframe, ignore depth
 */
let wireframe = 0;
let tones = true;

const handleMessage = (data: ServerMessage): ClientMessage | undefined => {
	switch (data.type) {
		case "ping":
			return {
				type: "pong",
			};
		case "pong":
			return {
				type: "ping",
			};
		case "entire-game-state":
			entities = data.entities.map((entity) => ClientEntity.from(engine, entity));
			colliders = data.physicsBodies.flatMap(({ position, quaternion, colliders }) => {
				const transform = mat4.fromRotationTranslation(mat4.create(), quaternion, position);
				return colliders.map((collider) => ({
					collider,
					transform: mat4.multiply(
						mat4.create(),
						transform,
						mat4.fromRotationTranslation(
							mat4.create(),
							collider.orientation ?? [0, 0, 0, 1],
							collider.offset ?? [0, 0, 0],
						),
					),
				}));
			});
			break;
		case "camera-lock":
			cameraLockTarget = data.entityName;
			isFirstPerson = data.pov === "first-person";
			camera.canRotate = isFirstPerson;
			break;
		default:
			throw new Error(`Unsupported message type '${data["type"]}'`);
	}
};
const connection = new Connection(wsUrl, handleMessage, document.getElementById("network-status"));

const engine = new GraphicsEngine(getGl());
const pipeline = new RenderPipeline(engine);
// pipeline.addFilter(pipeline.noOpFilter);
pipeline.addFilter(
	new ShaderProgram(
		engine,
		engine.createProgram(
			engine.createShader("vertex", filterVertexSource, "filter.vert"),
			engine.createShader("fragment", outlineFilterFragmentSource, "outlineFilter.frag"),
		),
	),
);
const camera = new PlayerCamera(
	vec3.fromValues(5, 5, 5),
	vec3.fromValues(0, Math.PI, 0),
	vec3.fromValues(0, 1, 0),
	Math.PI / 3,
	window.innerWidth / window.innerHeight,
	0.01,
	100,
	engine,
);

type DebugInputs = {
	toggleFreecam: boolean;
	cycleWireframe: boolean;
	toggleRole: boolean;
	toggleRoleKeepOld: boolean;
	spawnItem: boolean;
	toggleTones: boolean;
};
const defaultDebugInputs = {
	forward: false,
	backward: false,
	right: false,
	left: false,
	jump: false,
	freecamDown: false,
	toggleFreecam: false,
	cycleWireframe: false,
	toggleRole: false,
	toggleRoleKeepOld: false,
	spawnItem: false,
	toggleTones: false,
};
let debugInputs: FreecamInputs & DebugInputs = { ...defaultDebugInputs };
const inputListener = new InputListener({
	default: {
		...defaultDebugInputs,
		attack: false,
		use: false,
		emote: false,
	},
	keymap: {
		KeyW: "forward",
		KeyA: "left",
		KeyS: "backward",
		KeyD: "right",
		Space: "jump",
		KeyE: "emote",
		0: "attack", // Left mouse button
		2: "use", // Right mouse button
		KeyR: "use", // Alias for trackpad users' convenience (may be temporary)
		ShiftLeft: "freecamDown",
		KeyP: "toggleFreecam",
		KeyK: "cycleWireframe",
		KeyB: "toggleRole",
		KeyN: "toggleRoleKeepOld",
		KeyX: "spawnItem",
		KeyT: "toggleTones",
	},
	handleInputs: (inputs) => {
		if (inputs.toggleFreecam && !debugInputs.toggleFreecam) {
			freecam = !freecam;
			camera.setFree(freecam);
		}
		if (inputs.cycleWireframe && !debugInputs.cycleWireframe) {
			wireframe = (wireframe + 1) % 3;
		}
		if (inputs.toggleRole && !debugInputs.toggleRole) {
			connection.send({ type: "--debug-switch-role", keepBody: false });
		}
		if (inputs.toggleRoleKeepOld && !debugInputs.toggleRoleKeepOld) {
			connection.send({ type: "--debug-switch-role", keepBody: true });
		}
		if (inputs.spawnItem && !debugInputs.spawnItem) {
			connection.send({ type: "--debug-spawn-item" });
		}
		if (inputs.toggleTones && !debugInputs.toggleTones) {
			tones = !tones;
		}

		debugInputs = { ...inputs };

		if (!freecam) {
			const [x, y, z] = camera.getForwardDir();
			connection.send({
				type: "client-input",
				...inputs,
				lookDir: [x, y, z],
			});
		}
	},
	period: SERVER_GAME_TICK,
	_tempControls: document.getElementById("temporary-mobile-controls"),
});

// Define client-side only entities (to debug rendering)
const tempLightShader = new ShaderProgram(
	engine,
	engine.createProgram(
		engine.createShader("vertex", tempLightVertexSource, "temp_light.vert"),
		engine.createShader("fragment", tempLightFragmentSource, "temp_light.frag"),
	),
);
const tempEntities = [
	new TempLightEntity(tempLightShader, vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 0)),
	new TempLightEntity(tempLightShader, vec3.fromValues(-3, 0, 0), vec3.fromValues(0, 0, 30)),
	new TempLightEntity(tempLightShader, vec3.fromValues(0, 0, 0), vec3.fromValues(0.5, 0.1, 5)),
];

const ambientLight = [0.2, 0.2, 0.2] as const;

const paint = () => {
	camera.setAspectRatio(window.innerWidth / window.innerHeight);
	tempEntities[0].color = vec3.fromValues(27 / 360, 0.9, (100 * (Math.sin(Date.now() / 8372) + 1)) / 2 + 10);
	tempEntities[0].position = vec3.fromValues(0, Math.sin(Date.now() / 738) * 5 + 1, 0);
	tempEntities[1].position = vec3.fromValues(Math.cos(Date.now() / 3000) * 15, 2, Math.sin(Date.now() / 3000) * 15);

	// Set camera position
	if (!freecam && isFirstPerson) {
		for (const entity of entities) {
			entity.visible = entity.name !== cameraLockTarget;
		}
	}

	const cameraTarget = entities.find((entity) => entity.name === cameraLockTarget);
	if (cameraTarget) {
		const position = mat4.getTranslation(vec3.create(), cameraTarget.transform);
		// TEMP
		const dir = camera.getForwardDir();
		tempEntities[2].position = position; //vec3.add(vec3.create(), position, vec3.scale(vec3.create(), [dir[0], 0, dir[2]], 3));
		if (!freecam) {
			if (isFirstPerson) {
				camera.setPosition(position);
			} else {
				const offset = vec3.fromValues(-20, 50, 20);
				camera.setPosition(vec3.add(vec3.create(), position, offset));
				camera.setForwardDir(vec3.normalize(offset, vec3.scale(offset, offset, -1)));
			}
		}
	}
	if (freecam) {
		camera.updateFreecam(debugInputs);
	}

	engine.clear();

	// Cast shadows
	const lights = [...entities, ...tempEntities].flatMap((entity) => (entity.light ? [entity.light] : []));
	for (const light of lights) {
		light.renderShadowMap([...entities, ...tempEntities]);
	}

	pipeline.startRender();
	engine.clear(ambientLight);

	// Set up lighting
	const lightPositions: number[] = [];
	const lightColors: number[] = [];
	for (const [i, light] of lights.entries()) {
		lightPositions.push(...light.position);
		lightColors.push(...light.color);
		const shadowMap = light.getShadowMap();
		// Bind up to 8 shadow maps to texture indices 4..11
		engine.gl.activeTexture(engine.gl.TEXTURE0 + 4 + i);
		engine.gl.bindTexture(engine.gl.TEXTURE_CUBE_MAP, shadowMap);
	}
	engine.gltfMaterial.use();
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_eye_pos"), camera.getPosition());
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_num_lights"), lights.length);
	if (lights.length > 0) {
		engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_lights[0]"), lightPositions);
		engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_colors[0]"), lightColors);
	}
	engine.gl.uniform1iv(engine.gltfMaterial.uniform("u_point_shadow_maps[0]"), [4, 5, 6, 7, 8, 9, 10, 11]);
	engine.gl.uniform4f(engine.gltfMaterial.uniform("u_ambient_light"), ...ambientLight, 1);
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_enable_tones"), +tones);
	engine.gl.uniform1f(engine.gltfMaterial.uniform("u_tones"), 5);

	// Draw entities
	const view = camera.getViewProjectionMatrix();
	for (const entity of [...entities, ...tempEntities]) {
		entity.draw(view);
	}

	// Draw wireframes
	if (wireframe > 0) {
		engine.wireframeMaterial.use();
		engine.gl.uniformMatrix4fv(engine.wireframeMaterial.uniform("u_view"), false, view);
		if (wireframe === 2) {
			engine.gl.disable(engine.gl.DEPTH_TEST);
		}
		engine.gl.disable(engine.gl.CULL_FACE);
		for (const { collider, transform } of colliders) {
			engine.gl.uniformMatrix4fv(engine.wireframeMaterial.uniform("u_model"), false, transform);
			engine.drawWireframe(collider);
		}
		engine.gl.enable(engine.gl.CULL_FACE);
		if (wireframe === 2) {
			engine.gl.enable(engine.gl.DEPTH_TEST);
		}
	}

	pipeline.stopRender();

	pipeline.draw();

	engine.checkError();

	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
camera.listen();
paint();
