#version 300 es

precision mediump float;

#define BOX 1
#define PLANE 2
#define SPHERE 3

uniform mat4 u_view;
uniform mat4 u_model;
uniform lowp int u_shape;

out vec2 v_uv;

const vec3 boxVertices[8] =
    vec3[8](vec3(-1, -1, -1), vec3(-1, -1, 1), vec3(1, -1, 1), vec3(1, -1, -1),
            vec3(-1, 1, -1), vec3(-1, 1, 1), vec3(1, 1, 1), vec3(1, 1, -1));

const int boxIndices[36] = int[36](0, 3, 2, 0, 2, 1, // bottom
                                   0, 1, 5, 0, 5, 4, // side
                                   1, 2, 6, 1, 6, 5, // side
                                   2, 3, 7, 2, 7, 6, // side
                                   3, 0, 4, 3, 4, 7, // side
                                   4, 5, 6, 4, 6, 7  // top
);

const vec3 sphereVertices[12] =
    vec3[12](vec3(-1, -1, 0), vec3(-1, 1, 0), vec3(1, 1, 0), vec3(1, -1, 0),
             vec3(-1, 0, -1), vec3(-1, 0, 1), vec3(1, 0, 1), vec3(1, 0, -1),
             vec3(0, -1, -1), vec3(0, -1, 1), vec3(0, 1, 1), vec3(0, 1, -1));

const int sphereIndices[18] =
    int[18](0, 3, 2, 0, 2, 1, 4, 7, 6, 4, 6, 5, 8, 11, 10, 8, 10, 9);

const vec2 uv[6] = vec2[6](vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 0),
                           vec2(1, 1), vec2(0, 1));

void main() {
  vec3 vertex;
  if (u_shape == BOX) {
    vertex = boxVertices[boxIndices[gl_VertexID]];
  } else if (u_shape == PLANE) {
    vertex = vec3(100.0 * (uv[gl_VertexID] - vec2(0.5, 0.5)), 0);
  } else if (u_shape == SPHERE) {
    vertex = sphereVertices[sphereIndices[gl_VertexID]];
  }
  gl_Position = u_view * u_model * vec4(vertex, 1);
  v_uv = uv[gl_VertexID % 6];
}
