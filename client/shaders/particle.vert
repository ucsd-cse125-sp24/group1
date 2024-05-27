#version 300 es

uniform mat4 u_view;
uniform mat4 u_model;
uniform float u_size;
uniform float u_mass;
uniform float u_dt;

in vec3 a_position;
in vec3 a_velocity;
in float a_ttl;

out vec3 v_position;
out vec3 v_velocity;
flat out float v_ttl;

vec3 gravity = vec3(0, -5, 0);

void main() {
  // Technically `acceleration` should just be `gravity` but this gives us more
  // control
  vec3 acceleration = gravity * u_mass;
  v_velocity = a_velocity + acceleration * u_dt;
  v_position = a_position + v_velocity * u_dt;
  v_ttl = a_ttl - u_dt;
  gl_Position = u_view * u_model * vec4(v_position, 1.0);
  gl_PointSize = u_size;
}
