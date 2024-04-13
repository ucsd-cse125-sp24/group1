import "./index.css";
import GraphicsEngine from "./render/GraphicsEngine";
import { Connection } from "./net/Connection";
import { ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import { InputListener } from "./net/input";
import { getGl } from "./render/webgl";
import { mat4, vec3 } from "gl-matrix";
import Camera from "./render/Camera";
import { ClientEntity } from "./state/ClientEntity";
import { BoxGeometry } from "./render/geometries/BoxGeometry";
import { Material } from "./render/materials/Material";
import basicVertexSource from "./shaders/basic.vert";
import basicFragmentSource from "./shaders/basic.frag";

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");

let position = { x: 0, y: 0, z: 0 };

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
	}
};
const connection = new Connection(wsUrl, handleMessage, document.getElementById("network-status"));

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
			case 1: // Left mouse button
				return "use";
			default:
				return null;
		}
	},
	handleInputs: (inputs) => {
		connection.send({ type: "client-input", ...inputs });
	},
});

const engine = new GraphicsEngine(getGl());
const camera = new Camera(
	vec3.fromValues(5, 5, 5),
	vec3.normalize(vec3.create(), vec3.fromValues(-1, -1, -1)),
	vec3.fromValues(0, 1, 0),
	45,
	window.innerWidth / window.innerHeight,
	0.01,
	100,
);
const material = new Material(
	engine,
	engine.createShader("vertex", basicVertexSource),
	engine.createShader("fragment", basicFragmentSource),
);
const box1 = new ClientEntity(new BoxGeometry(engine, vec3.fromValues(0, 0, 0), vec3.fromValues(2, 2, 2)), material);
const box2 = new ClientEntity(new BoxGeometry(engine, vec3.fromValues(0, -5, 0), vec3.fromValues(1, 2, 3)), material);
const paint = () => {
	camera.aspectRatio = window.innerWidth / window.innerHeight;
	camera.update(mat4.fromYRotation(mat4.create(), 0.01));
	box1.geometry.transform = mat4.fromTranslation(mat4.create(), [position.x, position.y, position.z]);
	box2.geometry.transform = mat4.fromYRotation(mat4.create(), position.x + position.y + position.z);
	box2.geometry.transform = mat4.translate(box2.geometry.transform, box2.geometry.transform, [0, -5, 0]);

	engine.clear();
	box1.draw(camera.getViewProjectionMatrix());
	box2.draw(camera.getViewProjectionMatrix());

	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
paint();
