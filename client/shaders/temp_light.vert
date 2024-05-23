#version 300 es

precision mediump float;

uniform mat4 u_view;
uniform mat4 u_model;

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

void main() {
  gl_Position = u_view * u_model *
                vec4(boxVertices[boxIndices[gl_VertexID]] * vec3(0.2), 1);
}
