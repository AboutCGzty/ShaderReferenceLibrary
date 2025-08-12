#include "layer.sh"


BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );
	InputState input = getInputState ( sampleCoord );

	#if defined(INPUT_AO)
		state.result = input.occlusion;
	
	#elif defined(INPUT_CURVATURE)
		state.result = input.curvature;
	
	#elif defined(INPUT_THICKNESS)
		state.result = input.thickness;
	
	#elif defined(INPUT_NORMAL)
		state.result = input.normal * vec4(0.5,0.5,0.5,1.0) + vec4(0.5,0.5,0.5,0.0);		
	
	#elif defined(INPUT_NORMAL_OBJECT)
		state.result = input.normalObject * vec4(0.5,0.5,0.5,1.0) + vec4(0.5,0.5,0.5,0.0);
	
	#elif defined(INPUT_CAVITY)
		state.result = input.cavity;
	#else
		vec4(0.0, 0.0, 0.0, 0.0);
	#endif

	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}

