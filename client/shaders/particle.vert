#version 300 es
layout(location=0) in vec3 a_position;	
layout(location=1) in vec3 a_velocity; //which direction to move an how fast
layout(location=2) in float a_age;	//current age of particle in seconds
layout(location=3) in float a_life;	//Length of age a particle is allowed to live
layout(location=4) in vec3 a_normal;

layout(location=5) in vec3 a_texcoord;

out vec3 v_position;
out vec3 v_velocity;
out float v_age;
out float v_life;

uniform mat4 u_view;
uniform mat4 u_model;
uniform float u_time;
uniform mat4 uModalMatrix;



// A simple hash function
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

// Pseudo-random number generator
float random(vec2 st) {
    return hash(dot(st, vec2(12.9898,78.233)));
}

void main(void) {
    float age = u_time - a_age + a_normal.x * 0.0 + a_texcoord.x * 0.0;
    gl_PointSize = 10.0;

    if(age > a_life){
        float r = random(vec2(gl_VertexID, u_time));
        float ra = 6.283 * r;
        float rx = r * cos(ra);
        float rz = r * sin(ra);
        v_position = vec3(0.0, 0.0, 0.0);
        v_velocity = vec3(rx, (4.0 * r) + 2.0, rz);
        v_age = u_time;
        v_life = a_life;
    } else {
        v_velocity = a_velocity - vec3(0.0, 0.05, 0.0);
        v_position = a_position + 0.01 * v_velocity;
        v_age = a_age;
        v_life = a_life;
    }
    vec3 unused = a_normal;
    float unusedx = a_normal.x;
    gl_Position = u_view * u_model * vec4(v_position, 1.0);
}