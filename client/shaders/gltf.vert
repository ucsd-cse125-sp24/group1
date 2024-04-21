attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texcoord0;
attribute vec2 a_texcoord1;
attribute vec2 a_texcoord2;

uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_model_part;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;

void main() {
  v_position = vec3(u_model * u_model_part * vec4(a_position, 1));
  v_normal = normalize(vec3(u_model * u_model_part * vec4(a_normal, 0)));
  v_tangent = a_tangent;
  v_texcoord0 = a_texcoord0;
  v_texcoord1 = a_texcoord1;
  v_texcoord2 = a_texcoord2;

  gl_Position = u_view * vec4(v_position, 1);
}
