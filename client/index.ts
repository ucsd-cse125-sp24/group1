import "./index.css";
import "./net/Connection";
import "./render/webgl";
import "./net/input";
import GraphicsEngine from "./render/GraphicsEngine";
import { Connection } from "./net/Connection";
import { ClientMessage, ServerMessage } from "../common/messages";

const params = new URL(window.location.href).searchParams;
const wsUrl = params.get("ws") ?? window.location.href.replace(/^http/, "ws").replace(/\/$/, "");

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
	}
};
const connection = new Connection(wsUrl, handleMessage, document.getElementById("network-status"));

const graphicsEngine = new GraphicsEngine();
const paint = () => {
	graphicsEngine.update();
	graphicsEngine.draw();
	window.requestAnimationFrame(paint);
};
paint();
