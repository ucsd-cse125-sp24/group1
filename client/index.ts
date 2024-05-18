import { mat4, vec3 } from "gl-matrix";
import { Vector3 } from "../common/commontypes";
import { SERVER_GAME_TICK } from "../common/constants";
import { ClientInputMessage, ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import "./index.css";
import { listenErrors } from "./lib/listenErrors";
import { Connection } from "./net/Connection";
import { InputListener } from "./net/input";
import { PlayerCamera } from "./render/camera/PlayerCamera";
import { ClientEntity } from "./render/ClientEntity";
import GraphicsEngine from "./render/engine/GraphicsEngine";
import { getGl } from "./render/getGl";
import { PointLight } from "./render/lights/PointLight";
import { RenderPipeline } from "./render/engine/RenderPipeline";
import { ShaderProgram } from "./render/engine/ShaderProgram";
import filterVertexSource from "./shaders/filter.vert";
import outlineFilterFragmentSource from "./shaders/outlineFilter.frag";

const errorWindow = document.getElementById("error-window");
if (errorWindow instanceof HTMLDialogElement) {
	listenErrors(errorWindow);
} else {
	alert("Failed to get error window");
}

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");

let position = { x: 0, y: 0, z: 0 };
let entities: ClientEntity[] = [];
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

const inputListener = new InputListener({
	reset: (): ClientInputs => ({
		forward: false,
		backward: false,
		right: false,
		left: false,
		jump: false,
		attack: false,
		use: false,
		emote: false,
		lookDir: [0, 0, 0],
	}),
	handleKey: (key) => {
		switch (key) {
			case "KeyW":
				return "forward";
			case "KeyA":
				return "left";
			case "KeyS":
				return "backward";
			case "KeyD":
				return "right";
			case "Space":
				return "jump";
			case "KeyE":
				return "emote";
			case 0: // Left mouse button
				return "attack";
			case 2: // Right mouse button
			case "KeyR":
				return "use";
			default:
				return null;
		}
	},
	handleInputs: (inputs) => {
		let msg: ClientInputMessage = {
			type: "client-input",
			...inputs,
			lookDir: Array.from(camera.getForwardDir()) as Vector3,
		};
		connection.send(msg);
	},
	period: SERVER_GAME_TICK,
});

// for debug purposes
const handleDebugKey = (e: KeyboardEvent) => {
	switch (e.code) {
		case "KeyP": {
			freecam = !freecam;
			camera.setFree(freecam);
			if (freecam) {
				inputListener.disconnect();
			} else {
				inputListener.listen();
			}
			break;
		}
		case "KeyK": {
			wireframe = (wireframe + 1) % 3;
			break;
		}
		case "KeyB": {
			connection.send({ type: "--debug-switch-role", keepBody: e.shiftKey });
			break;
		}
	}
};
window.addEventListener("keydown", handleDebugKey);

// Define client-side only entities (to debug rendering)
const particles = new ClientEntity(engine, "", [{ model: engine.models.particles, transform: mat4.create() }]);
const tempEntities: ClientEntity[] = [particles];

/**
 * Up to 8 lights allowed by the gltf.frag shader
 */
const tempLights = [
	new PointLight(engine, vec3.fromValues(0, 1, 0), vec3.fromValues(0.3, 0.3, 0.3)),
	new PointLight(engine, vec3.fromValues(-3, 0, 0), vec3.fromValues(2, 2, 2)),
	new PointLight(engine, vec3.fromValues(0, 0, 0), vec3.fromValues(0.4, 0.5, 0.5)),
];

const paint = () => {
	camera.setAspectRatio(window.innerWidth / window.innerHeight);
	tempLights[0].color = vec3.fromValues(
		((Math.sin(Date.now() / 500) + 1) / 2) * 1,
		((Math.sin(Date.now() / 500) + 1) / 2) * 0.5,
		((Math.sin(Date.now() / 500) + 1) / 2) * 0.1,
	);
	tempLights[0].position[1] = Math.sin(Date.now() / 200) * 5 + 1;
	tempLights[1].position = vec3.fromValues(Math.cos(Date.now() / 3000) * 20, 0, Math.sin(Date.now() / 3000) * 20);

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
		tempLights[2].position = position;
		if (!freecam) {
			if (isFirstPerson) {
				camera.setPosition(position);
			} else {
				const offset = vec3.fromValues(-20, 50, 20);
				vec3.add(position, position, offset);
				camera.setPosition(position);
				camera.setForwardDir(vec3.normalize(offset, vec3.scale(offset, offset, -1)));
			}
		}
	}
	if (freecam) {
		camera.update();
	}

	engine.clear();

	// Cast shadows
	for (const light of tempLights) {
		light.renderShadowMap([...entities, ...tempEntities]);
	}

	pipeline.startRender();
	engine.clear();

	// Set up lighting
	const lightPositions: number[] = [];
	const lightColors: number[] = [];
	for (let i = 0; i < tempLights.length; i++) {
		const light = tempLights[i];
		lightPositions.push(...light.position);
		lightColors.push(...light.color);
		const shadowMap = light.getShadowMap();
		// Bind up to 8 shadow maps to texture indices 4..11
		engine.gl.activeTexture(engine.gl.TEXTURE0 + 4 + i);
		engine.gl.bindTexture(engine.gl.TEXTURE_CUBE_MAP, shadowMap);
	}
	engine.gltfMaterial.use();
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_eye_pos"), camera.getPosition());
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_num_lights"), tempLights.length);
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_lights[0]"), lightPositions);
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_colors[0]"), lightColors);
	engine.gl.uniform1iv(engine.gltfMaterial.uniform("u_point_shadow_maps[0]"), [4, 5, 6, 7, 8, 9, 10, 11]);
	engine.gl.uniform4f(engine.gltfMaterial.uniform("u_ambient_light"), 0.2, 0.2, 0.2, 1);

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
		for (const entity of entities) {
			entity.drawWireframe();
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
