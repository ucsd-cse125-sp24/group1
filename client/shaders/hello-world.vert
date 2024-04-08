attribute vec2 a_position;
uniform float u_rotation;

void main() {
  gl_Position = vec4(mat2(cos(u_rotation), sin(u_rotation), -sin(u_rotation),
                          cos(u_rotation)) *
                         a_position,
                     0, 1);
}
