#version 300 es

precision mediump float;

in vec2 v_uv;
out vec4 fragColor;

void main() { fragColor = vec4(v_uv, 0, 1); }
