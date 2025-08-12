#include "layer.sh"

USE_TEXTURE2D(tTexture);

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );
	state.result = formatInputColor( texture2D( tTexture, state.texCoord) );	
	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}

