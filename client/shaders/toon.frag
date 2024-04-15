precision mediump float;

#define GLSLIFY 1
// Common uniforms
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float u_frame;

// Common varyings
varying vec3 v_position;
varying vec3 v_normal;

uniform sampler2D u_texture;

/*
 *  Calculates the diffuse factor produced by the light illumination
 */
float diffuseFactor(vec3 normal, vec3 light_direction) {
    float df = dot(normalize(normal), normalize(light_direction));

    if (gl_FrontFacing) {
        df = -df;
    }

    return max(0.0, df);
}

/*
 * The main program
 */
void main() {
    // Use the mouse position to define the light direction
    float min_resolution = min(vec2(100,100).x, vec2(100,100).y);
    vec3 light_direction = -vec3((vec2(0,0) - 0.5 * vec2(100,100)) / min_resolution, 0.5);

    // Calculate the light diffusion factor
    float df = diffuseFactor(v_normal, light_direction);

    // Define the toon shading steps
    float nSteps = 4.0;
    float step = sqrt(df) * nSteps;
    step = (floor(step) + smoothstep(0.48, 0.52, fract(step))) / nSteps;

    // Calculate the surface color
    float surface_color = step * step;
    gl_FragColor = texture2D(u_texture, vec2(0,0) * 1.5);
    // Fragment shader output
    gl_FragColor = vec4(vec3(surface_color), 1.0);
}