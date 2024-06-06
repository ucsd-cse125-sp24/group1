precision mediump float;

varying vec2 v_texcoord;

uniform sampler2D u_texture_color;
uniform sampler2D u_texture_depth;
uniform float u_strength;

void main() {
  // https://www.shadertoy.com/view/lsKSWR
  vec2 uv = v_texcoord;
  uv *= 1.0 - uv.yx; // vec2(1.0)- uv.yx; -> 1.-u.yx; Thanks FabriceNeyret !
  float vig = uv.x * uv.y * 15.0; // multiply with sth for intensity
  vig = pow(
      vig,
      0.25 * u_strength); // change pow for modifying the extend of the vignette

  vig = (1.0 - vig); //* u_strength;

  vec4 color = texture2D(u_texture_color, v_texcoord);
  gl_FragColor = color * (1.0 - vig) + vec4(1, 0, 0, 1) * vig;
}
