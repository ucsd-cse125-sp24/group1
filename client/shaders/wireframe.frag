#version 300 es

precision mediump float;

uniform lowp int u_shape;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  if (u_shape == 1 || u_shape == 3) {
    if (pow(abs(v_uv.x * 2.0 - 1.0), 30.0) +
            pow(abs(v_uv.y * 2.0 - 1.0), 30.0) <
        0.5) {
      discard;
    }
  } else if (u_shape == 2) {
    vec2 gridCoord = mod(v_uv * 100.0, 1.0) - vec2(0.5, 0.5);
    if (gridCoord.x * gridCoord.x + gridCoord.y * gridCoord.y >
        exp(-pow(4.0 * (v_uv.x - 0.5), 2.0) - pow(4.0 * (v_uv.y - 0.5), 2.0)) *
            0.005) {
      discard;
    }
  }
  fragColor = vec4(1, 1, 1, 1);
}
