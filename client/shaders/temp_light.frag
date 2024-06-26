#version 300 es

precision mediump float;

uniform vec3 u_color;
out vec4 fragColor;

// All components are in the range [0…1], including hue.
// https://stackoverflow.com/a/17897228
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  fragColor = vec4(hsv2rgb(vec3(u_color.xy, min(u_color.z, 1.0))), 1);
}
