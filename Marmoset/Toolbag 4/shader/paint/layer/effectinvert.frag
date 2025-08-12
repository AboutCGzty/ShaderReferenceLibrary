#include "layer.sh"

USE_TEXTURE2D( tTexture );

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	LayerState state = getLayerState( fBufferCoord );	

	vec4 c = texture2DLod( tTexture, fBufferCoord, 0.0 );
	
	//c.rgb = invertColorFormatted( c.rgb );

	#if defined(LAYER_OUTPUT_SRGB) || defined(LAYER_EMULATE_SRGB) || defined(LAYER_OUTPUT_PERCEPTUAL)
		c.rgb = linearTosRGB(c.rgb);
	#endif

	c.rgb = vec3(1.0,1.0,1.0) - c.rgb;

	#if defined(LAYER_OUTPUT_SRGB) || defined(LAYER_EMULATE_SRGB) || defined(LAYER_OUTPUT_PERCEPTUAL)
		c.rgb = sRGBToLinear(c.rgb);
	#endif

	state.result = c;
	OUT_COLOR0 = compositeLayerState( state );
}
