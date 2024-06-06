import { mat4, vec3, vec4 } from "gl-matrix";
import { SERVER_GAME_TICK } from "../common/constants";
import { ClientMessage, EntireGameState, SerializedCollider, ServerMessage } from "../common/messages";
import { EntityId } from "../server/entities/Entity";
import { reverbImpulse, sounds } from "../assets/sounds";
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
import damageFilterFragmentSource from "./shaders/damageFilter.frag";
import { Transition } from "./lib/transition";
import { TextModel } from "./render/model/TextModel";
import { PauseMenu } from "./ui/components/PauseMenu";
import { GameplayUi } from "./ui/components/GameplayUi";
import { ensureName } from "./ui/components/NamePrompt";

const errorWindow = document.getElementById("error-window");
if (errorWindow instanceof HTMLDialogElement) {
	listenErrors(errorWindow);
} else {
	alert("Failed to get error window");
}

const playerName = await ensureName();

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
			entities = Object.values(data.entities).map((entity) => deserialize(engine, entity));
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
			if (data.stage.type === "lobby" && gameState?.stage.type !== "lobby") {
				unlockPointer();
				gameUi.hide();
				pauseMenu.show();
				inputListener.enabled = false;
			}
			gameState = data;
			break;
		case "camera-lock":
			cameraLockTarget = data.entityId;
			isFirstPerson = data.pov === "first-person";
			camera.canRotate = isFirstPerson && data.freeRotation;
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
		case "damage":
			damageFilterStrength.setValueInstant(1);
			damageFilterStrength.setTarget(0);
			break;
		default:
			throw new Error(`Unsupported message type '${data["type"]}'`);
	}
};
const connection = new Connection(wsUrl, handleMessage, document.getElementById("network-status"));

const { gl, audioContext, lockPointer, unlockPointer } = getContexts();
const convolver = audioContext.createConvolver();

// https://stackoverflow.com/questions/78202922/how-to-set-wetness-and-dryness-of-a-convolver-filter-in-the-web-audio-api
const raw = audioContext.createGain();
raw.gain.value = 1.0;

const dry = audioContext.createGain();
const wet = audioContext.createGain();
// const wetGain0 = audioContext.createGain();
// const wetGain1 = audioContext.createGain();
// const wetGain2 = audioContext.createGain();
// const wetGain3 = audioContext.createGain();

dry.connect(audioContext.destination);
wet.connect(audioContext.destination);

var mix = function (value: number) {
	dry.gain.value = 1.0 - value;
	wet.gain.value = value;
};

mix(0.05);

fetch(reverbImpulse)
	.then((r) => r.arrayBuffer())
	.then((buffer) => audioContext.decodeAudioData(buffer))
	.then((buffer) => {
		// convolver.normalize = false;
		convolver.buffer = buffer;
	});

raw.connect(dry);
raw.connect(convolver);

convolver.connect(wet);
const sound = new SoundManager(audioContext, raw);

const gameUi = new GameplayUi();
const pauseMenu = new PauseMenu();
document.body.append(gameUi.element, pauseMenu.element);
pauseMenu.show();

document.addEventListener("pointerlockchange", () => {
	if (document.pointerLockElement === engine.gl.canvas) {
		gameUi.show();
		pauseMenu.hide();
		inputListener.enabled = true;
	} else {
		gameUi.hide();
		pauseMenu.show();
		inputListener.enabled = false;
	}
});
let lastPointerType = "mouse";
document.addEventListener("click", (e) => {
	const trapClick =
		e.target instanceof Element && e.target.closest(".trap-clicks, .start-game-btn, .mobile-open-pause");
	const isStartBtn = trapClick instanceof Element && trapClick.classList.contains("start-game-btn");
	const isPauseBtn = trapClick instanceof Element && trapClick.classList.contains("mobile-open-pause");
	if (isPauseBtn) {
		gameUi.hide();
		pauseMenu.show();
		inputListener.enabled = false;
	} else if ((!trapClick && gameState && gameState.stage.type !== "lobby") || isStartBtn) {
		if (lastPointerType === "touch") {
			gameUi.show();
			pauseMenu.hide();
			inputListener.enabled = true;
			// NOTE: Currently, can't switch to touch after using mouse
		}
		lockPointer(lastPointerType === "touch");
	}
});
document.addEventListener("pointerdown", (e) => {
	lastPointerType = e.pointerType;
	if (e.pointerType === "touch") {
		gameUi.showMobile();
	} else {
		gameUi.hideMobile();
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
const damageFilter = {
	shader: new ShaderProgram(
		engine,
		engine.createProgram(
			engine.createShader("vertex", filterVertexSource, "filter.vert"),
			engine.createShader("fragment", damageFilterFragmentSource, "damageFilter.frag"),
		),
	),
	strength: 0,
};
const sporeFilterStrength = new Transition(0);
const damageFilterStrength = new Transition(0);
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
	damageFilter,
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

let result = vec3.create();
vec3.add(result, camera.getPosition(), camera.getForwardDir());

const particle = new ParticleSystem(engine, 100, {
	// spawnPeriod: 1000,
	// spawnCount: 3,
	// size: 1000,
	// color: [1, 0, 0, 0.5], // red color
	// mass: 1,
	initialPosition: [0, 10, 0],
	initialVelocity: [0, 2, 0],
	initialVelocityRange: [1, 1, 1],
	// ttl: 5,
});

type DebugInputs = {
	skipStage: boolean;
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
	skipStage: false,
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
		KeyI: "skipStage",
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
		if (inputs.skipStage && !debugInputs.skipStage) {
			connection.send({ type: "--debug-skip-stage" });
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
const whiteLight = new TempLightEntity(tempLightShader, vec3.fromValues(10, 20, -20), vec3.fromValues(0, 0, 30), false);
const staticLight2 = new TempLightEntity(
	tempLightShader,
	vec3.fromValues(-15, 5, 15),
	vec3.fromValues(27 / 360, 0.9, 50),
	false,
);
const staticLight3 = new TempLightEntity(
	tempLightShader,
	vec3.fromValues(-10, -10, -10),
	vec3.fromValues(0.5, 0.1, 10),
	false,
);
const coolLight = new TempLightEntity(tempLightShader, vec3.fromValues(0, 0, 0), vec3.fromValues(0.5, 0.1, 2));
const hueLightCount = engine.MAX_LIGHTS; // Math.floor(1 + Math.random() * 10);
const tempEntities: ClientEntity[] = [
	// coolLight,
	// warmLight,
	// whiteLight,
	// staticLight2,
	// staticLight3,
	...Array.from({ length: hueLightCount }, (_, i) => {
		const radius = 5 + Math.random() * 15;
		return new TempLightEntity(
			tempLightShader,
			vec3.fromValues(
				Math.cos((i / hueLightCount) * 2 * Math.PI) * radius,
				Math.random() * 40 - 20,
				Math.sin((i / hueLightCount) * 2 * Math.PI) * radius,
			),
			vec3.fromValues(i / hueLightCount, Math.random(), Math.exp(Math.random() * 4 - 1)),
			false,
		);
	}),
	new ClientEntity(engine, [
		{
			model: new TextModel(engine, "hey 羊 Â", 1, 64, { color: "red", family: '"Comic Sans MS"' }),
			transform: mat4.create(),
		},
	]),
	new ClientEntity(engine, [
		{
			model: new TextModel(engine, "bleh 😜", 1.5, 64, { color: "orange" }),
			transform: mat4.fromTranslation(mat4.create(), [0, -1, 1]),
		},
	]),
	new ClientEntity(engine, [
		{
			model: new TextModel(engine, "soiduhfuidsfhd yugsdg", 0.5, 64, { color: "cyan", family: "serif" }),
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

let previousStaticIds = "";
const paint = () => {
	engine._drawCalls = 0;
	warmLight.color = vec3.fromValues(27 / 360, 0.9, (50 * (Math.sin(Date.now() / 8372) + 1)) / 2 + 10);
	warmLight.position = vec3.fromValues(0, Math.sin(Date.now() / 738) * 5 + 1, 0);
	// whiteLight.position = vec3.fromValues(Math.cos(Date.now() / 3000) * 15, 10, Math.sin(Date.now() / 3000) * 15);

	// Set camera position
	if (!freecam && isFirstPerson) {
		for (const entity of entities) {
			entity.hasCamera = entity.data?.id === cameraLockTarget;
		}
	}

	const cameraTarget = entities.find((entity) => entity.data?.id === cameraLockTarget);
	if (cameraTarget && !freecam) {
		camera.setFree(false);
		const position = mat4.getTranslation(vec3.create(), cameraTarget.transform);
		// TEMP
		const dir = camera.getForwardDir();
		coolLight.position = position; //vec3.add(vec3.create(), position, vec3.scale(vec3.create(), [dir[0], 0, dir[2]], 3));
		sporeFilterStrength.setTarget(cameraTarget.data?.isSabotaged ? 1 : 0);
		fov.setTarget(cameraTarget.data?.isTrapped ? Math.PI / 6 : (pauseMenu.options.fov * Math.PI) / 180);
		if (isFirstPerson) {
			camera.setPosition(position);
			if (!camera.canRotate) {
				const [x, y, z] = vec4.transformMat4(vec4.create(), vec4.fromValues(0, 0, -1, 0), cameraTarget.transform);
				camera.setForwardDir(vec3.fromValues(x, y, z));
			}
		} else {
			const offset = vec3.fromValues(-20, 50, 20);
			camera.setPosition(vec3.add(vec3.create(), position, offset));
			camera.setForwardDir(vec3.normalize(offset, vec3.scale(offset, offset, -1)));
		}
	} else {
		// Spectate
		camera.setFree(true);
		camera.updateFreecam(debugInputs);
		coolLight.position = camera.getPosition();
	}
	// TODO: also call this when rotating camera?
	camera.moveAudioListener(audioContext.listener);

	camera.setAspectRatio(window.innerWidth / window.innerHeight);
	camera.setFovY(fov.getValue());
	sporeFilter.strength = sporeFilterStrength.getValue();
	damageFilter.strength = damageFilterStrength.getValue();

	engine.clear();

	// Cast shadows
	const staticIds = JSON.stringify(
		[...entities, ...tempEntities]
			.filter((entity) => entity.data?.isStatic)
			.map((entity) => [entity.data?.id, entity.data?.position]),
	);
	let recastStaticShadows = false;
	if (staticIds !== previousStaticIds) {
		previousStaticIds = staticIds;
		recastStaticShadows = true;
		console.time("Re-rendering static shadow map");
	}
	const lights = [...entities, ...tempEntities]
		.flatMap((entity) => (entity.light ? [entity.light] : []))
		.slice(0, engine.MAX_LIGHTS);
	for (const light of lights) {
		if (!light.willMove && !recastStaticShadows) {
			// Avoid re-rendering shadow map if static entities did not change
			continue;
		}
		light.renderShadowMap([...entities, ...tempEntities]);
	}
	if (recastStaticShadows) {
		console.timeEnd("Re-rendering static shadow map");
	}

	pipeline.startRender();
	engine.clear(pauseMenu.options.ambientLight);

	// Set up lighting
	const lightPositions: number[] = [];
	const lightColors: number[] = [];
	for (const [i, light] of lights.entries()) {
		lightPositions.push(...light.position);
		lightColors.push(...light.color);
		const shadowMap = light.getShadowMap();
		// Bind up to 8 shadow maps to texture indices 4..11
		engine.bindTexture(4 + i, "cubemap", shadowMap);
	}
	engine.gltfMaterial.use();
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_eye_pos"), camera.getPosition());
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_num_lights"), lights.length);
	if (lights.length > 0) {
		engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_lights[0]"), lightPositions);
		engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_colors[0]"), lightColors);
	}
	engine.gl.uniform1iv(
		engine.gltfMaterial.uniform("u_point_shadow_maps[0]"),
		Array.from({ length: engine.MAX_LIGHTS }).map((_, i) => 4 + i),
	);
	engine.gl.uniform4f(engine.gltfMaterial.uniform("u_ambient_light"), ...pauseMenu.options.ambientLight, 1);
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_enable_tones"), +tones);
	engine.gl.uniform1f(engine.gltfMaterial.uniform("u_tones"), 5);

	// Draw entities
	const view = camera.getViewProjectionMatrix();
	drawModels(
		view,
		[...entities, ...tempEntities].flatMap((entity) => entity.getModels("rendering")),
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

	const modelMatrices = [mat4.create()];
	particle.shader.use();
	particle.options.initialPosition = [result[0], result[1], result[2]];
	// Draw particles
	particle.draw(modelMatrices, view);

	pipeline.stopRender();

	pipeline.draw();

	// engine.checkError();

	gameUi.timer.renderTime();

	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
inputListener.enabled = false;
camera.listen();
gameUi.listen(inputListener, { forward: "forward", backward: "backward", right: "right", left: "left" });
pauseMenu.listen(connection);
pauseMenu.options.listen(camera);
paint();

console.log(engine);
