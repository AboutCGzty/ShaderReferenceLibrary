#include "layer.sh"

uniform vec4 uColor;

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );
	state.result = formatInputColor( uColor );	
	OUT_COLOR0 = compositeLayerState( state );
}

