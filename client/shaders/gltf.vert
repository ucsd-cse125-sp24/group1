// Per vertex
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_tangent;
attribute vec2 a_texcoord0;
attribute vec2 a_texcoord1;
attribute vec2 a_texcoord2;
attribute vec4 a_color0;

// Per instance
attribute mat4 a_model;
attribute mat4 a_normal_transform;

uniform mat4 u_view;
uniform mat4 u_model;
uniform mat4 u_normal_transform;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;
varying vec4 v_color0;

void main() {
  v_position = vec3(a_model * vec4(a_position, 1));
  v_normal = normalize((a_normal_transform * vec4(a_normal, 0)).xyz);
  v_tangent = a_tangent;
  v_texcoord0 = a_texcoord0;
  v_texcoord1 = a_texcoord1;
  v_texcoord2 = a_texcoord2;
  v_color0 = a_color0;

  gl_Position = u_view * vec4(v_position, 1);
}
