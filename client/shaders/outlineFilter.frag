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
  float depth = getDepth(v_texcoord);
  // TODO: use a vec2 uniform to pass in image size so we can access texels
  float depth_x0 = getDepth(vec2(v_texcoord.x - 0.001, v_texcoord.y));
  float depth_x1 = getDepth(vec2(v_texcoord.x + 0.001, v_texcoord.y));
  float depth_y0 = getDepth(vec2(v_texcoord.x, v_texcoord.y - 0.001));
  float depth_y1 = getDepth(vec2(v_texcoord.x, v_texcoord.y + 0.001));
  float threshold = 0.05 * depth;
  if (abs(depth - depth_x0) > threshold || abs(depth - depth_x1) > threshold ||
      abs(depth - depth_y0) > threshold || abs(depth - depth_y1) > threshold) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec4 color = texture2D(u_texture_color, v_texcoord);
  gl_FragColor = color;
}
