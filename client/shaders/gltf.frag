precision mediump float;

varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;

uniform sampler2D u_texture_color;
uniform sampler2D u_texture_metallic_roughness;
uniform sampler2D u_texture_normal;
uniform sampler2D u_texture_occlusion;
uniform sampler2D u_texture_emissive;

void main() {
  // TEMP: these lines are just here so the uniforms don't get discarded
  gl_FragColor = texture2D(u_texture_metallic_roughness, v_texcoord1);
  gl_FragColor = texture2D(u_texture_normal, v_texcoord2);

  gl_FragColor = texture2D(u_texture_color, v_texcoord0);
}
