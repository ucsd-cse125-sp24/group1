#version 300 es

precision mediump float;

uniform mat4 u_view;
uniform mat4 u_model;
uniform vec2 u_size;

out vec2 v_uv;

// Defines two triangles for a square from (0, 0) to (1, 1)
const vec2 uv[6] = vec2[6](vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 0),
                           vec2(1, 1), vec2(0, 1));
void main() {
  gl_Position = u_view * u_model *
                vec4((uv[gl_VertexID] - vec2(0.5, 0.5)) * vec2(u_size), 0, 1);
  v_uv = uv[gl_VertexID % 6];
}
