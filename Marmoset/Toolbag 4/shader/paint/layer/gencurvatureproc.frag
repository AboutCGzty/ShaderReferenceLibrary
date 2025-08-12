#include "layer.sh"
#include "gradientmap.frag"

uniform float	uEdgeIntensity;
uniform float	uEdgeThickness;
uniform float	uCavityIntensity;
uniform float	uCavityThickness;
uniform vec2	uCurveClamp;

float curveFunction( vec4 texel )
{
	float curve = (2.0 * texel.r) - 1.0;
	float edge = max( 0.0, curve - uCurveClamp.x ) * uCurveClamp.y;

	float thick;
	thick = 1.0 - uEdgeThickness;
	thick *= 0.5;
	thick = thick * 0.64 + 0.36;
	edge = pow(edge, thick);
	edge *= uEdgeIntensity;

	float cavity = max( 0.0, -curve - uCurveClamp.x ) * uCurveClamp.y;
	thick = 1.0 - uCavityThickness;
	thick *= 0.5;
	thick = thick * 0.6 + 0.4;
	cavity = pow(cavity, thick);
	cavity *= uCavityIntensity;
	
	cavity = min( 1.0, edge + cavity );
	return cavity;
}


#define PROCESSOR_NAME	Curve
#define PROCESSOR_FUNC	curveFunction
#include "processor.sh"

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );

	float value = processCurve( state.texCoord );
	state.result = vec4( value, value, value, 1.0 );	
	state.result = applyGradientMap(state.result);
	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}
