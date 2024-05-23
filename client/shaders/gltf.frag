precision mediump float;

varying vec3 v_position;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec2 v_texcoord0;
varying vec2 v_texcoord1;
varying vec2 v_texcoord2;
varying vec4 v_color0;

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
// In HSV
uniform vec3 u_point_colors[MAX_LIGHTS];
uniform samplerCube u_point_shadow_maps[MAX_LIGHTS];
uniform vec4 u_ambient_light;
uniform int u_enable_tones;
uniform float u_tones;

#define NEAR 0.001
#define FAR 100.0
float linearizeDepth(float depth) {
  // https://learnopengl.com/Advanced-OpenGL/Depth-testing
  float z = depth * 2.0 - 1.0; // convert to normalized device coords [-1, 1]
  return (2.0 * NEAR * FAR) / (FAR + NEAR - z * (FAR - NEAR));
}

// All components are in the range [0…1], including hue.
// https://stackoverflow.com/a/17897228
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 base_color =
      u_base_color *
      (u_has_texture_color == 1 ? texture2D(u_texture_color, v_texcoord0)
                                : vec4(1, 1, 1, 1)) *
      v_color0;
  float metallic =
      u_metallic * (u_has_texture_metallic_roughness == 1
                        ? texture2D(u_texture_metallic_roughness, v_texcoord1).b
                        : 1.0);
  float roughness =
      u_roughness *
      (u_has_texture_metallic_roughness == 1
           ? texture2D(u_texture_metallic_roughness, v_texcoord1).g
           : 1.0);

  vec3 to_eye = normalize(u_eye_pos - v_position);
  vec4 base_specular = vec4(0.5, 0.5, 0.5, 1.0);
  float shininess = 4.0;

  gl_FragColor = u_ambient_light * base_color;
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= u_num_lights) {
      break;
    }

    vec3 to_light = u_point_lights[i] - v_position;
    float distance = length(to_light);
    to_light = to_light / distance;
    float bruh = textureCube(u_point_shadow_maps[i], -to_light).r;
    float shadow_dist = linearizeDepth(bruh) *
                        2.0; // TODO: why does this need to be multiplied by 2?
    if (shadow_dist < distance - 0.005) {
      // TEMP
      gl_FragColor += vec4((distance - shadow_dist) / distance, 0.0, 0.0, 1.0);
      // occluded
      continue;
    }

    vec3 half_vector = normalize(to_light + to_eye);
    // Only adjust value (darkness) for HSV light color to avoid changing hue,
    // then convert to RGB
    if (u_enable_tones == 1) {
      distance = ceil(distance / u_tones) * u_tones;
    }
    vec4 light_color =
        vec4(hsv2rgb(vec3(u_point_colors[i].xy,
                          u_point_colors[i].z / (distance * distance))),
             1.0);
    vec4 diffuse_factor = light_color;
    vec4 diffuse = base_color * diffuse_factor;
    vec4 specular_factor =
        step(0.875, pow(max(dot(half_vector, v_normal), 0.0), shininess) *
                        light_color);
    vec4 specular = base_specular * specular_factor;

    gl_FragColor += diffuse + (u_enable_tones == 1 ? specular : vec4(0.0));
  }

  if (base_color.a < u_alpha_cutoff) {
    discard;
  }
}
