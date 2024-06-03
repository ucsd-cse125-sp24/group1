#version 300 es

precision mediump float;

uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 color;

void main() {
  vec4 pixel = texture(
      u_texture, vec2(gl_FrontFacing ? v_uv.x : 1.0 - v_uv.x, 1.0 - v_uv.y));
  if (pixel.a < 0.5) {
    discard;
  }
  color = vec4(pixel.rgb, 1);
}
