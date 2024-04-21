import { mat4, vec3 } from "gl-matrix";
import { fish1 } from "../assets/models/fish1";
import { fish2 } from "../assets/models/fish2";
import { Vector3 } from "../common/commontypes";
import { ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import "./index.css";
import { listenErrors } from "./lib/listenErrors";
import { GltfModelWrapper } from "./model/gltf-parser";
import { Connection } from "./net/Connection";
import { InputListener } from "./net/input";
import { PlayerCamera } from "./render/PlayerCamera";
import { ClientEntity } from "./render/ClientEntity";
import GraphicsEngine from "./render/GraphicsEngine";
import { BoxGeometry } from "./render/geometries/BoxGeometry";
import { getGl } from "./render/getGl";
import { PointLight } from "./render/lights/PointLight";

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
	}),
	handleKey: (key) => {
		switch (typeof key === "string" ? key.toLowerCase() : key) {
			case "w":
				return "forward";
			case "a":
				return "left";
			case "s":
				return "backward";
			case "d":
				return "right";
			case "space":
				return "jump";
			case "e":
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
		connection.send({
			type: "client-input",
			...inputs,
			lookDir: Array.from(camera.getForwardDir()) as Vector3,
		});
	},
});

const box1 = new ClientEntity(new BoxGeometry(engine.tempMaterial, vec3.fromValues(2, 2, 2)));
const box2 = new ClientEntity(new BoxGeometry(engine.tempMaterial, vec3.fromValues(1, 2, 3)));
const fish1Model = GltfModelWrapper.from(engine.gltfMaterial, fish1);
const fish2Model = GltfModelWrapper.from(engine.gltfMaterial, fish2);

/**
 * Up to 8 lights allowed by the gltf.frag shader
 */
const tempLights = [
	new PointLight(engine, vec3.fromValues(0, 5, 0), vec3.fromValues(10, 10, 10)),
	new PointLight(engine, vec3.fromValues(-3, 3, 0), vec3.fromValues(10, 10, 10)),
];

const paint = () => {
	camera.setAspectRatio(window.innerWidth / window.innerHeight);
	box1.transform = mat4.fromTranslation(mat4.create(), [position.x, position.y, position.z]);
	box2.transform = mat4.fromYRotation(mat4.create(), position.x + position.y + position.z);
	box2.transform = mat4.translate(box2.transform, box2.transform, [0, -5, 0]);

	engine.clear();

	for (const light of tempLights) {
		light.renderShadowMap(entities);
	}

	engine.clear();

	const view = camera.getViewProjectionMatrix();
	box1.draw(view);
	box2.draw(view);
	for (const entity of entities) {
		entity.draw(view);
	}
	engine.wireframeBox.material.use();
	engine.gl.uniformMatrix4fv(engine.wireframeBox.material.uniform("u_view"), false, view);
	engine.gl.disable(engine.gl.CULL_FACE);
	for (const entity of entities) {
		entity.drawWireframe();
	}
	engine.gl.enable(engine.gl.CULL_FACE);
	engine.gltfMaterial.use();

	const lightPositions: number[] = [];
	const lightIntensities: number[] = [];
	for (let i = 0; i < tempLights.length; i++) {
		const light = tempLights[i];
		lightPositions.push(...light.getPosition());
		lightIntensities.push(...light.getIntensity());
		const shadowMap = light.getShadowMap();
		// Bind up to 8 shadow maps to texture indices 8..15
		engine.gl.activeTexture(engine.gl.TEXTURE0 + 8 + i);
		engine.gl.bindTexture(engine.gl.TEXTURE_CUBE_MAP, shadowMap);
	}
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_eye_pos"), camera.getPosition());
	engine.gl.uniform1i(engine.gltfMaterial.uniform("u_num_lights"), tempLights.length);
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_lights[0]"), lightPositions);
	engine.gl.uniform3fv(engine.gltfMaterial.uniform("u_point_intensities[0]"), lightIntensities);
	engine.gl.uniform1iv(engine.gltfMaterial.uniform("u_point_shadow_maps[0]"), [8, 9, 10, 11, 12, 13, 14, 15]);

	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_view"), false, view);
	let transform = mat4.fromYRotation(mat4.create(), Date.now() / 1000);
	mat4.scale(transform, transform, [10, 10, 10]);
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_model"), false, transform);
	fish1Model.draw();
	transform = mat4.fromTranslation(mat4.create(), [10, 0, 0]);
	mat4.rotateY(transform, transform, -Date.now() / 200);
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_model"), false, transform);
	fish2Model.draw();

	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
camera.listen();
paint();
