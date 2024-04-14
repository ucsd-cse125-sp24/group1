attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texcoord0;
attribute vec2 a_texcoord1;
attribute vec2 a_texcoord2;

uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_model_part;

varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;

void main() {
  // TEMP: these lines are just here so the attributes don't get discarded
  vec3 temp = a_position;
  temp = a_normal;
  temp = a_tangent;

  gl_Position = u_view * u_model * u_model_part * vec4(a_position, 1);
  gl_Position = vec4(sign(a_position.x) * 0.2 + 0.4,
                     sign(a_position.y) * 0.2 + 0.4, -1, 1); // TEMP!

  v_texcoord0 = a_texcoord0;
  v_texcoord1 = a_texcoord1;
  v_texcoord2 = a_texcoord2;
}
