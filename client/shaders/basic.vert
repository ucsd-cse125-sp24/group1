attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 u_view;
uniform mat4 u_model;

varying vec3 v_normal;
varying vec3 v_diffuseColor;
varying vec2 v_texcoord;
varying vec3 v_position;

void main() {
  gl_Position = u_view * u_model * vec4(a_position, 1);
  // if not rigid transformation, should use inverse transpose of u_model
  // for the normals
  v_normal = normalize(vec3(u_model * vec4(a_normal, 0)));

  v_diffuseColor = 0.5 * (a_normal + vec3(1));
  v_position = a_position;
  v_texcoord = a_texcoord;
}
