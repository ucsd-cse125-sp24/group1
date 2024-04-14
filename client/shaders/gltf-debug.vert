#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_texcoord0;
in vec2 a_texcoord1;
in vec2 a_texcoord2;

uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_model_part;

out vec2 v_texcoord0;
out vec2 v_texcoord1;
out vec2 v_texcoord2;

void main() {
  // TEMP: these lines are just here so the attributes don't get discarded
  float temp = a_position.x;
  temp = a_normal.x;
  temp = a_tangent.x;
  temp = a_texcoord0.x;
  temp = a_texcoord1.x;
  temp = a_texcoord2.x;

  gl_Position = u_view * u_model * u_model_part * vec4(a_position, 1);

  if (gl_VertexID == 0) {
    gl_Position = vec4(0.4, 0.4, -1, 1);
  } else if (gl_VertexID == 2) {
    gl_Position = vec4(0.4, 0.6, -1, 1);
  } else if (gl_VertexID == 1) {
    gl_Position = vec4(0.6, 0.6, -1, 1);
  } else {
    gl_Position = vec4(0, 0, 0, 1);
  }
  v_texcoord0 = vec2(sign(a_position.x - 0.5) * 0.5 + 0.5,
                     sign(a_position.y) * 0.5 + 0.5);
  // gl_Position = vec4(sign(a_position.x) * 0.2 + 0.4,
  //                    sign(a_position.y) * 0.2 + 0.4, -1, 1);

  // v_texcoord0 = a_texcoord0;
  // v_texcoord1 = a_texcoord1;
  // v_texcoord2 = a_texcoord2;
}
