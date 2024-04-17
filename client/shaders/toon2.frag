precision mediump float; // set float to medium precision

// eye location
uniform vec3 uEyePosition; // the eye s position in world
        
// light properties
uniform vec3 uLightAmbient; // the light s ambient color
uniform vec3 uLightDiffuse; // the light s diffuse color
uniform vec3 uLightSpecular; // the light s specular color
uniform vec3 uLightPosition; // the lights position
        
// material properties
uniform vec3 uAmbient; // the ambient reflectivity
uniform vec3 uDiffuse; // the diffuse reflectivity
uniform vec3 uSpecular; // the specular reflectivity
uniform float uShininess; // the specular exponent
uniform float uTones; // number of tones
uniform float uSpecularTones; // number of specular tones

uniform sampler2D u_texture;

// geometry properties
varying vec3 v_position; // world xyz of fragment
varying vec3 v_normal; // normal of fragment

void main(void) {
        
    // ambient term
    vec3 ambient = uAmbient * uLightAmbient; 
            
    // diffuse term
    vec3 normal = normalize(v_normal); 
    vec3 light = normalize(uLightPosition - v_position);
    float lambert = max(0.0, dot(normal,light));
    float tone = floor(lambert * uTones);
    lambert = tone / uTones;
    vec3 diffuse = uDiffuse * uLightDiffuse * lambert; // diffuse term
            
    // specular term
    vec3 eye = normalize(uEyePosition - v_position);
    vec3 halfVec = normalize(light + eye);
    float highlight = pow(max(0.0, dot(normal, halfVec)),uShininess);
    tone = floor(highlight * uSpecularTones);
    highlight = tone / uSpecularTones;
    vec3 specular = uSpecular * uLightSpecular * highlight; // specular term
            
    // combine to find lit color
    vec3 litColor = ambient + diffuse + specular; 

    vec4 texColor = texture2D(u_texture, vec2(0,0)); // adjust coordinates as needed
    gl_FragColor = vec4(litColor, 1.0) * texColor; 
    gl_FragColor = vec4(normalize(v_normal) * 0.5 + 0.5, 1.0); // Normal visualizer
    // Debugging 
    //gl_FragColor = vec4(ambient, 1.0); // Check ambient color
    //gl_FragColor = vec4(diffuse, 1.0); // Check diffuse lighting
    //gl_FragColor = vec4(specular, 1.0); // Check specular highlights
    
} // end main