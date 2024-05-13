#version 300 es
precision mediump float;
out vec4 outColor;

void main(void) {
    //outColor = vec4(1.0, 0.0, 0.0, 1.0);

    
    vec2 delta 		= gl_PointCoord - vec2(0.5,0.5);//Distance from center
    float lenSqr 	= abs(dot(delta,delta));		//Length Squared (avoiding square roots)
    float a 		= smoothstep(0.25,0.24,lenSqr);	//Center, so 0.5*0.5 = 0.25, the squared len from center, avoiding roots.
    outColor		= vec4(0.0,0.0,1.0,a);			//Whatever the smooth step is, set as alpha blend.
		
}
