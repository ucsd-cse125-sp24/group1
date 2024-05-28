#version 300 es

precision mediump float;

uniform sampler2D u_texture;
uniform vec3 u_color;

in vec2 v_uv;
out vec4 color;

void main() {
  if (texture(u_texture,
              vec2(gl_FrontFacing ? v_uv.x : 1.0 - v_uv.x, 1.0 - v_uv.y))
          .a < 0.1) {
    discard;
  }
  color = vec4(u_color, 1);
}
