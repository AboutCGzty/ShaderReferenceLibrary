#include "layer.sh"
#include "gaussian.sh"

USE_TEXTURE2D( tColorLUT );

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	LayerState state = getLayerState( fBufferCoord );

	state.result.r = texture2D( tColorLUT, vec2( saturate(state.result.r), 0.5) ).r;
	state.result.g = texture2D( tColorLUT, vec2( saturate(state.result.g), 0.5) ).g;
	state.result.b = texture2D( tColorLUT, vec2( saturate(state.result.b), 0.5) ).b;
	state.result.a = texture2D( tColorLUT, vec2( saturate(state.result.a), 0.5) ).a;


	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}

