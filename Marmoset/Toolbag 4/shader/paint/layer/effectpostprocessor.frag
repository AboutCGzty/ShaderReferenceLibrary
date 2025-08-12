#include "gaussian.sh"
#include "layernoise.sh"
#include "gradientmap.frag"

#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif

#define PROCESSOR_NAME	InputTexture
#include "processor.sh"

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );

	state.result = processV4InputTexture( state.texCoord );
	state.result.w = 1.0f;
	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}
