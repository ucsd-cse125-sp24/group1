precision mediump float;

varying vec3 v_normal;
varying vec3 v_diffuseColor;

void main() {
  // these can be turned into uniforms
  vec3 ambientColor = vec3(0.5, 0.5, 0.5);
  vec3 lightDirection = normalize(vec3(1, 4, 2));
  vec3 lightColor = vec3(0.9, 0.9, 1);

  vec3 irradiance = ambientColor + lightColor * max(dot(lightDirection, v_normal), 0.0);
  gl_FragColor = vec4(irradiance * v_diffuseColor, 1);
}
