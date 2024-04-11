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

const glContext = canvas.getContext("webgl2");
if (!glContext) {
  throw new Error("Failed to get WebGL context");
}
globalThis.gl = glContext;
gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);
