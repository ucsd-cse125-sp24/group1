import { mat4, vec3 } from "gl-matrix";
import { Vector3 } from "../common/commontypes";
import { ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import "./index.css";
import { Connection } from "./net/Connection";
import { InputListener } from "./net/input";
import Camera from "./render/Camera";
import GraphicsEngine from "./render/GraphicsEngine";
import { BoxGeometry } from "./render/geometries/BoxGeometry";
import { getGl } from "./render/getGl";
import { ClientEntity } from "./render/ClientEntity";
import { fish1 } from "../assets/models/fish1";
import { fish2 } from "../assets/models/fish2";
import { listenErrors } from "./lib/listenErrors";

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
		case "CUBEEEEE":
			position = data;
			break;
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
const camera = new Camera(
	vec3.fromValues(5, 5, 5),
	vec3.fromValues(0, 0, 0),
	vec3.fromValues(0, 1, 0),
	45,
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
			lookDir: Array.from(camera.forward) as Vector3,
		});
	},
});

const box1 = new ClientEntity(new BoxGeometry(engine.tempMaterial, vec3.fromValues(2, 2, 2)));
const box2 = new ClientEntity(new BoxGeometry(engine.tempMaterial, vec3.fromValues(1, 2, 3)));
let draw1 = () => {};
fish1(engine.gltfMaterial).then((drawFuncs) => {
	draw1 = () => {
		for (const fn of drawFuncs) {
			fn();
		}
	};
});
let draw2 = () => {};
fish2(engine.gltfMaterial).then((drawFuncs) => {
	draw2 = () => {
		for (const fn of drawFuncs) {
			fn();
		}
	};
});

const paint = () => {
	camera.aspectRatio = window.innerWidth / window.innerHeight;
	box1.transform = mat4.fromTranslation(mat4.create(), [position.x, position.y, position.z]);
	box2.transform = mat4.fromYRotation(mat4.create(), position.x + position.y + position.z);
	box2.transform = mat4.translate(box2.transform, box2.transform, [0, -5, 0]);

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
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_view"), false, view);
	let transform = mat4.fromYRotation(mat4.create(), Date.now() / 1000);
	mat4.scale(transform, transform, [10, 10, 10]);
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_model"), false, transform);
	draw1();
	transform = mat4.fromTranslation(mat4.create(), [10, 0, 0]);
	mat4.rotateY(transform, transform, -Date.now() / 200);
	engine.gl.uniformMatrix4fv(engine.gltfMaterial.uniform("u_model"), false, transform);
	draw2();

	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
camera.listen();
paint();
