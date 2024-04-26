#version 300 es

precision mediump float;

#define BOX 1
#define PLANE 2
#define SPHERE 3
#define CYLINDER 4

uniform mat4 u_view;
uniform mat4 u_model;
uniform lowp int u_shape;
// Allows numeric parameters to be passed to the vertex shader
// - BOX: x radius, y radius, z radius (where radius is half the side length
//   from the origin)
// - PLANE: unused
// - SPHERE: x radius, y radius, z radius from origin
// - CYLINDER: top radius, bottom radius, half height (from origin), segment
//   angle (2 PI / # segments)
uniform vec4 u_size;

out vec2 v_uv;
flat out int v_face;

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

// Defines three planes (6 triangles) on each orthogonal plane to draw circles
// on
const vec3 sphereVertices[12] =
    vec3[12](vec3(-1, -1, 0), vec3(-1, 1, 0), vec3(1, 1, 0), vec3(1, -1, 0),
             vec3(-1, 0, -1), vec3(-1, 0, 1), vec3(1, 0, 1), vec3(1, 0, -1),
             vec3(0, -1, -1), vec3(0, -1, 1), vec3(0, 1, 1), vec3(0, 1, -1));

const int sphereIndices[18] =
    int[18](0, 3, 2, 0, 2, 1, 4, 7, 6, 4, 6, 5, 8, 11, 10, 8, 10, 9);

// Defines two triangles for a square from (0, 0) to (1, 1)
const vec2 uv[6] = vec2[6](vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 0),
                           vec2(1, 1), vec2(0, 1));

#define PI 3.1415926538

void main() {
  v_face = 0;

  vec3 vertex;
  if (u_shape == BOX) {
    vertex = boxVertices[boxIndices[gl_VertexID]] * u_size.xyz;
  } else if (u_shape == PLANE) {
    // Defines a big 50 by 50 flat square
    vertex = vec3(100.0 * (uv[gl_VertexID] - vec2(0.5, 0.5)), 0);
  } else if (u_shape == SPHERE) {
    vertex = sphereVertices[sphereIndices[gl_VertexID]] * u_size.xyz;
  } else if (u_shape == CYLINDER) {
    vec2 xy = 2.0 * uv[gl_VertexID % 6] - vec2(1, 1);
    if (gl_VertexID < 12) {
      // Defines a plane for the top and bottom circle
      xy *= gl_VertexID < 6 ? u_size.x : u_size.y;
      vertex = vec3(xy.x, gl_VertexID < 6 ? u_size.z : -u_size.z, xy.y);
    } else {
      // Defines planes for each of the segments around the cylinder
      // Angle around the cylinder's circle for this vertex
      float angle =
          float(gl_VertexID / 6 + int(xy.x == 1.0 ? 1 : 0)) * u_size.w;
      // Distance from the center for this particular vertex
      float radius = xy.y == -1.0 ? u_size.y : u_size.x;
      vertex = vec3(cos(angle) * radius, xy.y * u_size.z, sin(angle) * radius);
      v_face = 1;
    }
  }
  gl_Position = u_view * u_model * vec4(vertex, 1);
  v_uv = uv[gl_VertexID % 6];
}
