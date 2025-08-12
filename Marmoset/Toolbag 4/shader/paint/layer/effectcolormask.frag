#include "layer.sh"

USE_TEXTURE2D( tTexture );

uniform int			uNumColors;
uniform vec4		uColors[16];
uniform float		uThresholdRange;



float compare( vec3 a, vec3 b, float maxDiff )
{
	float dx = a.x-b.x;
	float dy = a.y-b.y;
	float dz = a.z-b.z;
	if( dx < 0 ) dx = -dx;
	if( dy < 0 ) dy = -dy;
	if( dz < 0 ) dz = -dz;
	float p = (dx+dy+dz)/3;
	p *= 1.0f-maxDiff;
	float result = 0;
	if( p == 0 )
	{ result = 1; }
	else if( p <= maxDiff )
	{
		float pd = p / maxDiff;
		result = 1.0f - pd;
	}
	return result;
}

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );

	vec3 sample = texture2DLod( tTexture, sampleCoord, 0.0 ).xyz;
	float value = 0.0f;

	for(int i = 0;i<uNumColors;i++)
	{
		float c = compare( sample, uColors[i].xyz, uColors[i].w * uThresholdRange );
		value = max( c, value );
	}

	state.result = vec4( value, value, value, 1.0 );	
	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}
