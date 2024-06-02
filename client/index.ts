import { mat4, vec3 } from "gl-matrix";
import { SERVER_GAME_TICK } from "../common/constants";
import { ClientMessage, EntireGameState, SerializedCollider, ServerMessage } from "../common/messages";
import { EntityId } from "../server/entities/Entity";
import { sounds } from "../assets/sounds";
import gltfDebugDepthFragmentSource from "./shaders/gltf_debug_depth.frag";
import gltfDebugLightFragmentSource from "./shaders/gltf_debug_light.frag";
import gltfDebugUniqueShadowFragmentSource from "./shaders/gltf_debug_unique_shadow.frag";
import gltfVertexSource from "./shaders/gltf.vert";
import "./ui/index.css";
import { listenErrors } from "./lib/listenErrors";
import { Connection } from "./net/Connection";
import { InputListener } from "./net/InputListener";
import { FreecamInputs, PlayerCamera } from "./render/camera/PlayerCamera";
import { ClientEntity, deserialize } from "./render/ClientEntity";
import GraphicsEngine from "./render/engine/GraphicsEngine";
import { getContexts } from "./render/getContexts";
import { RenderPipeline } from "./render/engine/RenderPipeline";
import { ShaderProgram } from "./render/engine/ShaderProgram";
import tempLightVertexSource from "./shaders/temp_light.vert";
import tempLightFragmentSource from "./shaders/temp_light.frag";
import { TempLightEntity } from "./render/lights/TempLightEntity";
import { SoundManager } from "./SoundManager";
import { ParticleSystem } from "./render/model/ParticleSystem";
import { drawModels } from "./render/model/draw";
import filterVertexSource from "./shaders/filter.vert";
import outlineFilterFragmentSource from "./shaders/outlineFilter.frag";
import sporeFilterFragmentSource from "./shaders/sporeFilter.frag";
import { Transition } from "./lib/transition";
import { TextModel } from "./render/model/TextModel";
import { PauseMenu } from "./ui/components/PauseMenu";
import { GameplayUi } from "./ui/components/GameplayUi";

const errorWindow = document.getElementById("error-window");
if (errorWindow instanceof HTMLDialogElement) {
	listenErrors(errorWindow);
} else {
	alert("Failed to get error window");
}

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");

let gameState: EntireGameState | undefined;
let entities: ClientEntity[] = [];
let colliders: { collider: SerializedCollider; transform: mat4 }[] = [];
let cameraLockTarget: EntityId | null = null;
let isFirstPerson: boolean = true;
let freecam: boolean = false; // for debug purposes
/**
 * Wireframe mode, for debug purposes.
 * - 0: hide wireframe
 * - 1: show wireframe, use depth buffer
 * - 2: show wireframe, ignore depth
 */
let wireframe = 0;
let tones = false;

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
			entities = data.entities.map((entity) => deserialize(engine, entity));
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

			gameUi.render(data, gameState);
			pauseMenu.render(data, gameState);
			gameState = data;
			break;
		case "camera-lock":
			cameraLockTarget = data.entityId;
			isFirstPerson = data.pov === "first-person";
			camera.canRotate = isFirstPerson;
			break;
		case "sound":
			if (sounds[data.sound]) {
				let source = sounds[data.sound];
				if (Array.isArray(source)) {
					source = source[Math.floor(Math.random() * source.length)];
				}
				const { panner } = sound.play(source);
				[panner.positionX.value, panner.positionY.value, panner.positionZ.value] = data.position;
			}
			break;
		case "particle":
			// Play particle here
			particle.enable();

			break;
		case "sabotage-hero":
			sporeFilterStrength.setTarget(1);
			setTimeout(() => sporeFilterStrength.setTarget(0), data.time);
			break;
		case "game-over":
			// TEMP
			console.log(`TEMP: GAME OVER - ${data.winner} win(s)`);
			break;
		default:
			throw new Error(`Unsupported message type '${data["type"]}'`);
	}
};
const connection = new Connection(wsUrl, handleMessage, document.getElementById("network-status"));

const { gl, audioContext, lockPointer } = getContexts();
const sound = new SoundManager(audioContext);

// lockPointer();
// inputListener.listen();
// camera.listen();

const gameUi = new GameplayUi();
const pauseMenu = new PauseMenu();
pauseMenu.listen(connection);
document.body.append(gameUi.element, pauseMenu.element);
pauseMenu.show();

document.addEventListener("pointerlockchange", () => {
	if (document.pointerLockElement === engine.gl.canvas) {
		gameUi.show();
		pauseMenu.hide();
	} else {
		gameUi.hide();
		pauseMenu.show();
	}
});
document.addEventListener("click", (e) => {
	const trapClick = e.target instanceof Element && e.target.closest(".trap-clicks");
	console.log(trapClick, e.target);
	if (!trapClick) {
		lockPointer();
	}
});

const engine = new GraphicsEngine(gl);
const sporeFilter = {
	shader: new ShaderProgram(
		engine,
		engine.createProgram(
			engine.createShader("vertex", filterVertexSource, "filter.vert"),
			engine.createShader("fragment", sporeFilterFragmentSource, "sporeFilter.frag"),
		),
	),
	strength: 0,
};
const sporeFilterStrength = new Transition(0);
const pipeline = new RenderPipeline(engine, [
	{
		shader: new ShaderProgram(
			engine,
			engine.createProgram(
				engine.createShader("vertex", filterVertexSource, "filter.vert"),
				engine.createShader("fragment", outlineFilterFragmentSource, "outlineFilter.frag"),
			),
		),
	},
	sporeFilter,
]);
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
const fov = new Transition(Math.PI / 3);

const particle = new ParticleSystem(engine, 10, 1000, 5, {
	size: 16,
	color: [1, 0, 0], // red color
	mass: 1,
	initialPosition: camera.getForwardDir(),
	initialVelocity: [0, 1, 0],
	initialVelocityRange: undefined,
	ttl: 5,
});

type DebugInputs = {
	toggleFreecam: boolean;
	cycleWireframe: boolean;
	toggleTones: boolean;
	cycleDebugGltf: boolean;
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
	toggleTones: false,
	cycleDebugGltf: false,
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
		KeyE: "use", // Alias for trackpad users' convenience (may be temporary)
		0: "attack", // Left mouse button
		2: "use", // Right mouse button
		KeyR: "use",
		ShiftLeft: "freecamDown",
		KeyP: "toggleFreecam",
		KeyK: "cycleWireframe",
		KeyX: "emote",
		KeyT: "toggleTones",
		KeyL: "cycleDebugGltf",
	},
	handleInputs: (inputs) => {
		if (inputs.toggleFreecam && !debugInputs.toggleFreecam) {
			freecam = !freecam;
			camera.setFree(freecam);
		}
		if (inputs.cycleWireframe && !debugInputs.cycleWireframe) {
			wireframe = (wireframe + 1) % 3;
		}
		if (inputs.toggleTones && !debugInputs.toggleTones) {
			tones = !tones;
		}
		if (inputs.cycleDebugGltf && !debugInputs.cycleDebugGltf) {
			engine.gltfMaterial._debugProgram =
				debugGltfShaders[(debugGltfShaders.indexOf(engine.gltfMaterial._debugProgram) + 1) % debugGltfShaders.length];
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
const warmLight = new TempLightEntity(tempLightShader, vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 0));
const whiteLight = new TempLightEntity(tempLightShader, vec3.fromValues(-3, 0, 0), vec3.fromValues(0, 0, 30));
const coolLight = new TempLightEntity(tempLightShader, vec3.fromValues(0, 0, 0), vec3.fromValues(0.5, 0.1, 5));
const tempEntities: ClientEntity[] = [
	coolLight,
	warmLight,
	whiteLight,
	new ClientEntity(engine, [
		{ model: new TextModel(engine, "hey 羊 Â", 1, 64, [1, 0, 0.1], '"Comic Sans MS"'), transform: mat4.create() },
	]),
	new ClientEntity(engine, [
		{
			model: new TextModel(engine, "bleh 😜", 1.5, 64, [1, 0, 0.1]),
			transform: mat4.fromTranslation(mat4.create(), [0, -1, 1]),
		},
	]),
	new ClientEntity(engine, [
		{
			model: new TextModel(engine, "soiduhfuidsfhd yugsdg", 0.5, 64, [1, 0, 0.1], "serif"),
			transform: mat4.fromYRotation(mat4.create(), Math.PI / 4),
		},
	]),
];
console.log(tempEntities[3]);

const debugGltfShaders = [
	engine.gltfMaterial._debugProgram,
	engine.createProgram(
		engine.createShader("vertex", gltfVertexSource, "gltf.vert"),
		engine.createShader("fragment", gltfDebugDepthFragmentSource, "gltf_debug.frag"),
	),
	engine.createProgram(
		engine.createShader("vertex", gltfVertexSource, "gltf.vert"),
		engine.createShader("fragment", gltfDebugLightFragmentSource, "gltf_debug.frag"),
	),
	engine.createProgram(
		engine.createShader("vertex", gltfVertexSource, "gltf.vert"),
		engine.createShader("fragment", gltfDebugUniqueShadowFragmentSource, "gltf_debug.frag"),
	),
];

const ambientLight = [0.2, 0.2, 0.2] as const;

const paint = () => {
	warmLight.color = vec3.fromValues(27 / 360, 0.9, (100 * (Math.sin(Date.now() / 8372) + 1)) / 2 + 10);
	warmLight.position = vec3.fromValues(0, Math.sin(Date.now() / 738) * 5 + 1, 0);
	whiteLight.position = vec3.fromValues(Math.cos(Date.now() / 3000) * 15, 2, Math.sin(Date.now() / 3000) * 15);

	// Set camera position
	if (!freecam && isFirstPerson) {
		for (const entity of entities) {
			entity.visible = entity.data?.id !== cameraLockTarget;
		}
	}

	const cameraTarget = entities.find((entity) => entity.data?.id === cameraLockTarget);
	if (cameraTarget) {
		const position = mat4.getTranslation(vec3.create(), cameraTarget.transform);
		// TEMP
		const dir = camera.getForwardDir();
		coolLight.position = position; //vec3.add(vec3.create(), position, vec3.scale(vec3.create(), [dir[0], 0, dir[2]], 3));
		sporeFilterStrength.setTarget(cameraTarget.data?.isSabotaged ? 1 : 0);
		fov.setTarget(cameraTarget.data?.isTrapped ? Math.PI / 6 : Math.PI / 3);
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
	// TODO: also call this when rotating camera?
	camera.moveAudioListener(audioContext.listener);

	camera.setAspectRatio(window.innerWidth / window.innerHeight);
	camera.setFovY(fov.getValue());
	sporeFilter.strength = sporeFilterStrength.getValue();

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
	drawModels(
		view,
		[...entities, ...tempEntities].flatMap((entity) => entity.getModels()),
	);

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
	const modelMatrices = [
		mat4.create(), // Identity matrix for default transformation
		mat4.fromTranslation(mat4.create(), [1, 0, 0]), // Translate by (1, 0, 0)
		mat4.fromRotation(mat4.create(), Math.PI / 4, [0, 1, 0]), // Rotate 45 degrees around Y axis
	];

	// Initialize view matrix (e.g., camera positioned at (0, 0, 5), looking at the origin)
	const viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 5], [0, 0, 0], [0, 1, 0]);
	particle.draw(modelMatrices, viewMatrix);

	// engine.checkError();

	gameUi.timer.renderTime();

	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
camera.listen();
paint();
