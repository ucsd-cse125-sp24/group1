#version 300 es

precision mediump float;

#define BOX 1
#define PLANE 2
#define SPHERE 3
#define CYLINDER 4

uniform lowp int u_shape;

in vec2 v_uv;
flat in int v_face;
out vec4 fragColor;

void main() {
  if (u_shape == BOX || u_shape == CYLINDER && v_face == 1) {
    if (pow(abs(v_uv.x * 2.0 - 1.0), 30.0) +
            pow(abs(v_uv.y * 2.0 - 1.0), 30.0) <
        0.5) {
      discard;
    }
  } else if (u_shape == PLANE) {
    vec2 gridCoord = mod(v_uv * 100.0, 1.0) - vec2(0.5, 0.5);
    if (gridCoord.x * gridCoord.x + gridCoord.y * gridCoord.y >
        exp(-pow(4.0 * (v_uv.x - 0.5), 2.0) - pow(4.0 * (v_uv.y - 0.5), 2.0)) *
            0.005) {
      discard;
    }
  } else if (u_shape == SPHERE || u_shape == CYLINDER && v_face == 0) {
    float radius = length(v_uv * 2.0 - vec2(1.0, 1.0));
    if (radius < 0.98 || radius > 1.0) {
      discard;
    }
  }
  fragColor = vec4(1, 1, 1, 1);
}
