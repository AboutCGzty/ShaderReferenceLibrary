

////////////////////////////////////////////////////////////////////////////////////////////
//generic gradient mapper code - uses start/end colors for 2-tone OR full UI gradient texture
////////////////////////////////////////////////////////////////////////////////////////////

uniform int		uInvertGradient;
USE_TEXTURE2D( tTextureGradient );//use gradient UI texture

float invertGradient( float color, float invert )
{
	// lerp( color, 1-color, t );
	// (1-t)*color + t*(1-color)
	// t*(-2*color + 1) + color;
	return (invert * ((-2.0*color) + 1.0)) + color;
}

vec3 invertGradient( vec3 color, float invert )
{
	return (invert * ((-2.0*color) + vec3(1.0,1.0,1.0))) + color;
}

vec4 sampleGradientMap(float p)
{
	vec2 gradientSampleCoords = vec2(p, 0.0);
	vec4 result = texture2DLod( tTextureGradient, gradientSampleCoords, 0.0 );
	return result;
}

vec4 applyGradientMap(vec4 color)
{
#define PRESERVE_RGB 1 
#if		PRESERVE_RGB
	//preserve relative RGB so color images can map to default gradient (grayscale 0 to 1)
	
	// lerp( color, 1-color, uInvertGradient );
	// (1-t)*color + t*(1-color)
	// t*(-2*color + 1) + color;
	color.xyz = invertGradient( color.xyz, uInvertGradient );

	vec4 colorGradientR = sampleGradientMap(color.x);
	vec4 colorGradientG = sampleGradientMap(color.y);
	vec4 colorGradientB = sampleGradientMap(color.z);
	color.x = colorGradientR.x;
	color.y = colorGradientG.y;
	color.z = colorGradientB.z;
#else
	float avg = (color.x + color.y + color.z)/3.0; //condense input to grayscale
	avg = invertGradient( avg, uInvertGradient );
	color = sampleGradientMap(avg);
#endif
	return color;
}
////////////////////////////////////////////////////////////////////////////////////////////

