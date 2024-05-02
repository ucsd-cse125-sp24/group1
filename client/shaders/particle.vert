#version 300 es
layout(location=0) in vec3 a_vertices;
layout(location=1) in vec3 a_position;
layout(location=2) in vec3 a_velocity; //which direction to move an how fast
layout(location=3) in float	a_age;
layout(location=4) in float	a_life;


out vec3 v_position;
out vec3 v_velocity;
out float v_age;
out float v_life;

uniform mat4 u_view;
uniform mat4 u_model;
uniform float u_time;
uniform mat4 uModalMatrix;



// A simple hash function
highp float random(vec2 co){
		highp float a = 12.9898;
		highp float b = 78.233;
		highp float c = 43758.5453;
		highp float dt = dot(co.xy ,vec2(a,b));
		highp float sn = mod(dt,3.14);
		return fract(sin(sn) * c);
	}

void main(void) {
    float age = u_time - a_age;
    gl_PointSize = 20.0 * (1.0 - (age / a_life));

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
        v_velocity = a_velocity - vec3(0.0, 0.01, 0.0);
        v_position = a_position + 0.01 * v_velocity;
        v_age = a_age;
        v_life = a_life;
    }
    gl_Position = u_view * u_model * vec4(a_vertices + v_position, 1.0);
}