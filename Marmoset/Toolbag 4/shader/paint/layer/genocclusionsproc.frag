#include "layer.sh"
#include "gradientmap.frag"

#define PROCESSOR_NAME AO
#include "processor.sh"

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );
	
	float value = processAO( sampleCoord );

	state.result = vec4( value, value, value, 1.0 );
	state.result = applyGradientMap(state.result);
	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}
