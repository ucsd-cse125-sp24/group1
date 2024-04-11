import "./index.css";
import "./net/network";
import "./render/webgl";
import "./input";
import GraphicsEngine from "./render/GraphicsEngine";

function main() {
	const graphicsEngine = new GraphicsEngine();
	const paint = () => {
		graphicsEngine.update();
		graphicsEngine.draw();
		window.requestAnimationFrame(paint);
	};
	paint();
}

main();
