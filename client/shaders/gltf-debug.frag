#version 300 es

precision mediump float;

in vec2 v_texcoord0;
in vec2 v_texcoord1;
in vec2 v_texcoord2;

uniform sampler2D u_texture_color;
uniform sampler2D u_texture_metallic_roughness;
uniform sampler2D u_texture_normal;
uniform sampler2D u_texture_occlusion;
uniform sampler2D u_texture_emissive;

out vec4 fragColor;

void main() {
  // TEMP: these lines are just here so the uniforms don't get discarded
  fragColor = texture(u_texture_metallic_roughness, v_texcoord1);
  fragColor = texture(u_texture_normal, v_texcoord2);

  fragColor = texture(u_texture_color, v_texcoord0);
  fragColor = vec4(v_texcoord0, 0, 1);
}
