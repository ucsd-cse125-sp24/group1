precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture_color;
uniform sampler2D u_texture_depth;
uniform vec2 u_resolution;

void main() {
  // Half pixel
  vec2 pixel = vec2(1.0) / u_resolution;
  gl_FragColor = (texture2D(u_texture_color, v_texcoord - vec2(pixel.x, 0.0)) +
                  texture2D(u_texture_color, v_texcoord + vec2(pixel.x, 0.0)) +
                  texture2D(u_texture_color, v_texcoord - vec2(0.0, pixel.y)) +
                  texture2D(u_texture_color, v_texcoord + vec2(0.0, pixel.y))) /
                 4.0;
}
