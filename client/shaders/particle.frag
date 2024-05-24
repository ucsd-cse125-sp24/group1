#version 300 es
precision mediump float;

uniform vec3 u_color;

in float v_ttl;

out vec4 outColor;

void main() {
  float r = length(gl_PointCoord - vec2(0.5, 0.5));
  if (r <= 0.5 && v_ttl > 0.0) {
    outColor = vec4(u_color, 1.0);
  } else {
    discard;
  }
}
