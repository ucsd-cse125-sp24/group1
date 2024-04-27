precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture_color;
uniform sampler2D u_texture_depth;

void main() {
  vec4 unused = texture2D(u_texture_depth, v_texcoord);
  gl_FragColor = texture2D(u_texture_color, v_texcoord) + 0.0 * unused;
}
