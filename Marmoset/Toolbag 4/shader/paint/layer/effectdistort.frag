#include "gaussian.sh"
#include "layernoise.sh"
#include "layer.sh"

USE_TEXTURE2D( tTexture );
USE_TEXTURE2D( tUVLUT );

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );	

	vec2 uv = texture2DLod( tUVLUT, sampleCoord, 0.0 ).xy;
	state.result = formatInputColor( texture2DLod( tTexture, uv, 0.0 ) );
	OUT_COLOR0 = compositeLayerState( state );
}
