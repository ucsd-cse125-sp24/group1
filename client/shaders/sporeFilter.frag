precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture_color;
uniform sampler2D u_texture_depth;

float near = 0.001;
float far = 100.0;
float getDepth(vec2 texcoord) {
  float depth = texture2D(u_texture_depth, texcoord).r;
  // https://learnopengl.com/Advanced-OpenGL/Depth-testing
  float z = depth * 2.0 - 1.0; // convert to normalized device coords [-1, 1]
  return (2.0 * near * far) / (far + near - z * (far - near));
}

void main() {
  vec4 color = texture2D(u_texture_color, v_texcoord);
  color.r = min(color.r * 3.0, 1.0);
  color.g *= 0.5;
  color.b = min(color.b * 3.0, 1.0);
  float depth = getDepth(v_texcoord);
  gl_FragColor = color * (1.0 - smoothstep(0.0, 1.0, depth));
}
