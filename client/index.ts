import "./index.css";
import GraphicsEngine from "./render/GraphicsEngine";
import { Connection } from "./net/Connection";
import { ClientInputs, ClientMessage, ServerMessage } from "../common/messages";
import { InputListener } from "./net/input";
import { getGl } from "./render/webgl";
import { mat4 } from "gl-matrix";

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

const graphicsEngine = new GraphicsEngine(getGl());
const paint = () => {
	graphicsEngine.update();
	graphicsEngine.box.transform = mat4.fromTranslation(mat4.create(), [position.x, position.y, position.z]);
	graphicsEngine.draw();
	window.requestAnimationFrame(paint);
};

connection.connect();
inputListener.listen();
paint();
