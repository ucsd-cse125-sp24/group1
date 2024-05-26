import { allowDomExceptions } from "../lib/allowDomExceptions";

export type Contexts = {
	gl: WebGL2RenderingContext;
	audioContext: AudioContext;
};

export function getContexts(): Contexts {
	const audioContext = new AudioContext();

	const canvas = document.getElementById("canvas");
	if (!(canvas instanceof HTMLCanvasElement)) {
		throw new Error("No <canvas> element present");
	}

	// Set <canvas> size to the size of the page
	// https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
	const observer = new ResizeObserver(([entry]) => {
		let width: number, height: number;
		let dpr = window.devicePixelRatio;
		if (entry.devicePixelContentBoxSize) {
			width = entry.devicePixelContentBoxSize[0].inlineSize;
			height = entry.devicePixelContentBoxSize[0].blockSize;
			dpr = 1;
		} else if (entry.contentBoxSize) {
			width = entry.contentBoxSize[0].inlineSize;
			height = entry.contentBoxSize[0].blockSize;
		} else {
			width = entry.contentRect.width;
			height = entry.contentRect.height;
		}
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
	});
	observer.observe(canvas, { box: "content-box" });

	canvas.addEventListener("click", async () => {
		audioContext.resume();
		// Lock pointer to canvas
		// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
		if (!document.pointerLockElement) {
			try {
				await canvas.requestPointerLock({ unadjustedMovement: true });
			} catch (error) {
				// Ignore these errors:
				// - SecurityError: The user has exited the lock before this request was
				//   completed. [clicking screen shortly after pressing escape]
				// - UnknownError: If you see this error we have a bug. Please report
				//   this bug to chromium. [tapping screen on Android]
				allowDomExceptions(error, ["SecurityError", "UnknownError"]);
			}
		}
		// Enter landscape mode (Android only)
		// https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
		if ("lock" in screen.orientation && screen.orientation.type.startsWith("portrait")) {
			try {
				await document.documentElement.requestFullscreen();
				await screen.orientation.lock("landscape");
			} catch (error) {
				// Ignore these errors:
				// - NotSupportedError: screen.orientation.lock() is not available on
				//   this device.
				allowDomExceptions(error, ["NotSupportedError"]);
			}
		}
	});

	const gl = canvas.getContext("webgl2");
	if (!gl) {
		throw new Error("Failed to get WebGL context");
	}
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);

	return { gl, audioContext };
}
