/*
    example1.frag

    A quick custom shader example. For much more information, please read:
	https://www.marmoset.co/posts/toolbag_custom_shaders/
*/

//provides FragmentState
#include "../state.frag"

//provides misc params like 'uCustomTime'
#include "../other/customExtras.sh"

//Two simple shader uniforms. These values are automatically hooked up to UI.
//Note the extra information in the comments on each line.
uniform vec3 uColor1;   //color  name "Inner Color"  default 1,0.1,0.5
uniform vec3 uColor2;   //color  name "Outer Color"  default 0,1,0
uniform float uSpeed;	//name "Pulse Speed"  default 2  min 0  max 10
uniform int uWaveFunc;	//name "Waveform" default 0 labels "Sin" "Saw" "Square"

//A simple shader function that adds an angle-dependent emissive term.
void    ShaderExample1( inout FragmentState s )
{
	float theta = uSpeed * uCustomTime;
	float w;
	if( uWaveFunc == 0 )
	{
		//sin wave
		w = 0.5*sin(theta) + 0.5;
	}
	else if( uWaveFunc == 1 )
	{
		//saw wave
		w = frac( (theta + 0.5*3.141592) / (3.141592 * 2.0) );
		w = 2.0*( w > 0.5 ? 1.0-w : w );
	}
	else
	{
		//square wave
		w = sin(theta) < 0.0 ? 0.0 : 1.0;
	}
	
	vec3 color2 = w * uColor2; //animate color2 with simple pulse

    s.emissiveLight = mix( color2, uColor1, saturate(dot(s.normal,s.vertexEye)) );
}

//Use our function in the emissive slot.
#ifdef Emissive
    #undef Emissive
#endif
#define Emissive    ShaderExample1
