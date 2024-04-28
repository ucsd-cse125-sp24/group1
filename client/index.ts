import { mat4, vec3 } from "gl-matrix";
import { fish1 } from "../assets/models/fish1";
import { fish2 } from "../assets/models/fish2";
import { Vector3 } from "../common/commontypes";
import { ClientInputMessage, ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import "./index.css";
import { listenErrors } from "./lib/listenErrors";
import { GltfModelWrapper } from "./render/model/gltf-parser";
import { Connection } from "./net/Connection";
import { InputListener } from "./net/input";
import { PlayerCamera } from "./render/camera/PlayerCamera";
import { ClientEntity } from "./render/ClientEntity";
import GraphicsEngine from "./render/engine/GraphicsEngine";
import { BoxGeometry } from "./render/geometries/BoxGeometry";
import { getGl } from "./render/getGl";
import { PointLight } from "./render/lights/PointLight";
import { particleGeometry } from "./render/geometries/ParticleGeometry";
import { cavecube } from "../assets/models/cavecube";
import { defaultCubeColor } from "../assets/models/default-cube-color";
import { donut } from "../assets/models/donut";

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
let freecam: boolean = false; // for debug purposes

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
			break;
		default:
			throw new Error(`Unsupported message type '${data["type"]}'`);
	}
};
const connection = new Connection<ServerMessage, ClientMessage>(
	wsUrl,
	handleMessage,
	document.getElementById("network-status"),
);

const engine = new GraphicsEngine(getGl());
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
			case 1: // Right mouse button
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
});

// for debug purposes
const handleFreecam = (e: KeyboardEvent) => {
	if (e.code === "KeyP") {
		freecam = !freecam;
		camera.setFree(freecam);
		if (freecam) {
			inputListener.disconnect();
		} else {
			inputListener.listen();
		}
	}
};
window.addEventListener("keydown", handleFreecam);

const box1 = new ClientEntity(engine, "", [engine.models.box1]);
const box2 = new ClientEntity(engine, "", [engine.models.box2]);
const box3 = new ClientEntity(engine, "", [engine.models.box3]);

/**
 * Up to 8 lights allowed by the gltf.frag shader
 */
const tempLights = [
	new PointLight(engine, vec3.fromValues(0, 5, 0), vec3.fromValues(10, 10, 10)),
	new PointLight(engine, vec3.fromValues(-3, 3, 0), vec3.fromValues(30, 30, 30)),
];

const paint = () => {
	camera.setAspectRatio(window.innerWidth / window.innerHeight);
	box1.transform = mat4.fromTranslation(mat4.create(), [position.x, position.y, position.z]);
	box2.transform = mat4.fromYRotation(mat4.create(), position.x + position.y + position.z);
	box2.transform = mat4.translate(box2.transform, box2.transform, [0, -5, 0]);

	if (!freecam) {
		for (const entity of entities) {
			entity.visible = entity.name !== cameraLockTarget;
		}

		const cameraTarget = entities.find((entity) => entity.name === cameraLockTarget);
		if (cameraTarget) {
			camera.setPosition(mat4.getTranslation(vec3.create(), cameraTarget.transform));
		}
	} else {
		camera.update();
	}

	engine.clear();

	for (const light of tempLights) {
		light.renderShadowMap(entities);
	}

	engine.startRender();
	engine.clear();

	const view = camera.getViewProjectionMatrix();
	box1.draw(view);
	box2.draw(view);
	box3.draw(view);
	for (const entity of entities) {
		entity.draw(view);
	}
	engine.wireframeMaterial.use();
	engine.gl.uniformMatrix4fv(engine.wireframeMaterial.uniform("u_view"), false, view);
	engine.gl.disable(engine.gl.CULL_FACE);
	for (const entity of entities) {
		entity.drawWireframe();
	}
	engine.gl.enable(engine.gl.CULL_FACE);
	engine.gltfMaterial.use();

	tempLights[0].intensity = vec3.fromValues(
		10 + ((Math.sin(Date.now() / 500) + 1) / 2) * 100,
		10 + ((Math.sin(Date.now() / 500) + 1) / 2) * 50,
		10 + ((Math.sin(Date.now() / 500) + 1) / 2) * 10,
	);
	tempLights[1].position = vec3.fromValues(Math.cos(Date.now() / 300) * 10, 3, Math.sin(Date.now() / 300) * 10);

	const lightPositions: number[] = [];
	const lightIntensities: number[] = [];
	for (let i = 0; i < tempLights.length; i++) {
		const light = tempLights[i];
		lightPositions.push(...light.position);
		lightIntensities.push(...light.intensity);
		const shadowMap = light.getShadowMap();
		// Bind up to 8 shadow maps to texture indices 4..11
		engine.gl.activeTexture(engine.gl.TEXTURE0 + 4 + i);
		engine.gl.bindTexture(engine.gl.TEXTURE_CUBE_MAP, shadowMap);
	}
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_eye_pos"), camera.getPosition());
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_num_lights"), tempLights.length);
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_lights[0]"), lightPositions);
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_intensities[0]"), lightIntensities);
	engine.gl.uniform1iv(engine.gltfMaterial.uniform("u_point_shadow_maps[0]"), [4, 5, 6, 7, 8, 9, 10, 11]);

	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_view"), false, view);
	engine.gl.uniformMatrix4fv(
		engine.gltfMaterial.uniform("u_model"),
		false,
		mat4.fromTranslation(mat4.create(), [7, -5, 7]),
	);
	engine.models.donut.draw();
	engine.gl.uniformMatrix4fv(
		engine.gltfMaterial.uniform("u_model"),
		false,
		mat4.fromTranslation(mat4.create(), [5, -10, 5]),
	);
	engine.models.cavecube.draw();
	engine.models.defaultCubeColor.draw();
	let transform = mat4.fromYRotation(mat4.create(), Date.now() / 1000);
	mat4.scale(transform, transform, [10, 10, 10]);
	mat4.multiply(transform, mat4.fromTranslation(mat4.create(), [0, -3, 0]), transform);
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_model"), false, transform);
	engine.models.fish1.draw();
	transform = mat4.fromTranslation(mat4.create(), [10, 0, 0]);
	mat4.rotateY(transform, transform, -Date.now() / 10000);
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_model"), false, transform);
	engine.models.fish2.draw();

	engine.stopRender();

	engine.draw();

	window.requestAnimationFrame(paint);

	engine.checkError();
};

connection.connect();
inputListener.listen();
camera.listen();
paint();
