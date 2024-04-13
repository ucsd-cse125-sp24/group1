#version 300 es

precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  if (pow(abs(v_uv.x * 2.0 - 1.0), 30.0) + pow(abs(v_uv.y * 2.0 - 1.0), 30.0) <
      0.5) {
    discard;
  }
  fragColor = vec4(v_uv, 0, 1);
}
