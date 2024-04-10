import "./index.css";
import "./net/network";
import vertexShaderSource from "./shaders/hello-world.vert";
import fragmentShaderSource from "./shaders/hello-world.frag";

const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new TypeError("No <canvas> element present");
}

// Set <canvas> size to the size of the page
const observer = new ResizeObserver(([{ contentBoxSize }]) => {
  const [{ blockSize, inlineSize }] = contentBoxSize;
  canvas.width = blockSize;
  canvas.height = inlineSize;
});
observer.observe(canvas);

const gl = canvas.getContext("webgl");
if (!gl) {
  throw new TypeError("Failed to get WebGL context");
}

const vertexShader = createShader(gl, "vertex", vertexShaderSource);
const fragmentShader = createShader(gl, "fragment", fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([0, 0, 0, 0.5, 0.7, 0]),
  gl.STATIC_DRAW
);

const paint = () => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform1f(rotationUniformLocation, (Date.now() / 200) % (2 * Math.PI));
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.requestAnimationFrame(paint);
};
paint();

function createShader(
  gl: WebGLRenderingContext,
  type: "vertex" | "fragment",
  source: string
): WebGLShader {
  const shader = gl.createShader(
    type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
  );
  if (shader) {
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
  }
  gl.deleteShader(shader);
  throw new TypeError("Failed to create shader");
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram {
  const program = gl.createProgram();
  if (program) {
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return program;
    }
    console.error(gl.getProgramInfoLog(program));
  }
  gl.deleteProgram(program);
  throw new TypeError("Failed to create program");
}
