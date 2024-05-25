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
  // float z = depth * 2.0 - 1.0; // convert to normalized device coords [-1, 1]
  return (2.0 * NEAR * FAR) / (FAR + NEAR - depth * (FAR - NEAR));
}

// All components are in the range [0…1], including hue.
// https://stackoverflow.com/a/17897228
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// #define W -0.005
#define W 0.0

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
    float bruh = textureCube(u_point_shadow_maps[i], -to_light / distance).r;
    float shadow_dist = linearizeDepth(bruh);
    // https://stackoverflow.com/a/10789527
    vec3 abs_to_light = abs(to_light);
    float local_z = max(abs_to_light.x, max(abs_to_light.y, abs_to_light.z));
    float local_depth =
        (2.0 * FAR * NEAR / local_z - (FAR + NEAR)) / (FAR - NEAR);
    float local_depth2 = ((FAR + NEAR) / (FAR - NEAR) -
                          (2.0 * FAR * NEAR) / (FAR - NEAR) / local_z + 1.0) *
                         0.5;
    // gl_FragColor = vec4(vec3(mod(local_depth, 0.00001) / 0.00001,
    //                          mod(local_depth, 0.000001) / 0.000001,
    //                          mod(local_depth, 0.0000001) / 0.0000001),
    //                     1.0);
    // gl_FragColor = vec4(
    //     vec3(shadow_dist < local_z ? 1.0 - (shadow_dist - local_z) / -10.0
    //                                : 1.0,
    //          shadow_dist > local_z ? 1.0 - (shadow_dist - local_z) / 10.0
    //          : 1.0, mod(shadow_dist, 0.00001) / 0.00001),
    //     1.0);
    gl_FragColor =
        vec4(bruh < local_depth2 ? (local_depth2 - bruh) * 100000.0 : 0.0, 0.0,
             bruh > local_depth2 ? (bruh - local_depth2) * 100000.0 : 0.0, 1.0);
    // gl_FragColor = vec4((local_depth - 1.0) * 1000.0, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4((1.0 - local_depth2) * 1000.0, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4((1.0 - bruh) * 1000.0, 0.0, 0.0, 1.0);
    /*
    if (shadow_dist < local_z + W) {
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
    //*/
  }

  if (base_color.a < u_alpha_cutoff) {
    discard;
  }
}
