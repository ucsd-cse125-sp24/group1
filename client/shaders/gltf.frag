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

#define MAX_LIGHTS 8
uniform vec3 u_eye_pos;
uniform int u_num_lights;
uniform vec3 u_point_lights[MAX_LIGHTS];
uniform vec3 u_point_intensities[MAX_LIGHTS];
uniform samplerCube u_point_shadow_maps[MAX_LIGHTS];

// TEMP: converting from shadow map to world space
float near = 0.001;
float far = 100.0;
float linearizeDepth(float depth) {
  // https://learnopengl.com/Advanced-OpenGL/Depth-testing
  float z = depth * 2.0 - 1.0; // convert to normalized device coords [-1, 1]
  return (2.0 * near * far) / (far + near - z * (far - near));
}
// end TEMP

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

  // gl_FragColor = base_color * (1.0 + 0.0 * unused);

  vec3 to_eye = normalize(u_eye_pos - v_position);
  vec4 specular = vec4(0.5, 0.5, 0.5, 1.0);
  float shininess = 4.0;
  vec4 irradiance = vec4(0.0, 0.0, 0.0, 1.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= u_num_lights) {
      break;
    }
    vec3 to_light = u_point_lights[i] - v_position;
    float distance = length(to_light);
    to_light = normalize(to_light);
    float shadow_dist = linearizeDepth(textureCube(u_point_shadow_maps[i], -to_light).r);
    if (shadow_dist < distance - 0.005) {
      // occluded
      continue;
    }
    vec3 half_vector = normalize(to_light + to_eye);
    vec4 intensity = vec4(u_point_intensities[i], 1.0);
    // TODO: check that this lighting calculation is correct + add ambient lighting
    irradiance +=
        base_color * max(dot(to_light, v_normal), 0.0) * intensity +
        specular * pow(max(dot(half_vector, v_normal), 0.0), shininess) * intensity;
  }
  gl_FragColor = irradiance;

  if (gl_FragColor.a < u_alpha_cutoff) {
    discard;
  }
}
