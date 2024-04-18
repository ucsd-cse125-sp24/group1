precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;

uniform vec4 u_base_color;
uniform sampler2D u_texture_color;
uniform int u_has_texture_color;
uniform float u_metallic;
uniform float u_roughness;
uniform sampler2D u_texture_metallic_roughness;
uniform int u_has_texture_metallic_roughness;
uniform sampler2D u_texture_normal;
uniform int u_has_texture_normal;
uniform sampler2D u_texture_occlusion;
uniform int u_has_texture_occlusion;
uniform sampler2D u_texture_emissive;
uniform int u_has_texture_emissive;
uniform vec3 u_emissive;
uniform float u_alpha_cutoff;

void main() {
  // TEMP: these lines are just here so the uniforms don't get discarded
  float unused;
  unused += u_base_color.x;
  unused += u_metallic;
  unused += u_roughness;
  unused += u_emissive.x;
  unused += texture2D(u_texture_metallic_roughness, v_texcoord1).x;
  unused += texture2D(u_texture_normal, v_texcoord2).x;
  int unusedInt;
  unusedInt += u_has_texture_color;
  unusedInt += u_has_texture_metallic_roughness;
  unusedInt += u_has_texture_normal;
  unusedInt += u_has_texture_occlusion;
  unusedInt += u_has_texture_emissive;
  // end TEMP

  vec4 base_color =
      u_base_color * (u_has_texture_color == 1
                          ? texture2D(u_texture_color, v_texcoord0)
                          : vec4(1, 1, 1, 1));
  float metallic =
      u_metallic * (u_has_texture_metallic_roughness == 1
                        ? texture2D(u_texture_metallic_roughness, v_texcoord1).b
                        : 1.0);
  float roughness =
      u_roughness *
      (u_has_texture_metallic_roughness == 1
           ? texture2D(u_texture_metallic_roughness, v_texcoord1).g
           : 1.0);

  gl_FragColor = base_color * (1.0 + 0.0 * unused);

  if (gl_FragColor.a < u_alpha_cutoff) {
    discard;
  }
}
