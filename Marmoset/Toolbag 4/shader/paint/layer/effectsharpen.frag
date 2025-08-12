#include "gaussian.sh"
#include "layernoise.sh"
#include "layer.sh"

USE_TEXTURE2D( tTexture );
uniform float uRadius;
uniform float uLOD;
uniform float uAmount;

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;
	LayerState state = getLayerState( sampleCoord );
	
	///

	//hex aspects
	const vec2 aspect_r = vec2(uRadius, uRadius); 	
	const vec2 aspect_h = 0.866 * aspect_r;
	
	const vec2 hexagon[] = {
		vec2( 1.0, 0.0 ),
		vec2( 0.5, 0.866 ),
		vec2(-0.5, 0.866 ),
		vec2(-1.0, 0.0 ),
		vec2(-0.5,-0.866 ),
		vec2( 0.5,-0.866 ),
	};

	vec4 origin = texture2D( tTexture, sampleCoord );
	origin = formatInputColor( origin );
	vec4 sum = vec4(0.0,0.0,0.0,0.0);
	vec4 sum_w = vec4(0.0,0.0,0.0,0.0);
	
	//outer hexel	
	{
		HINT_UNROLL
		for( int i=0; i<6; ++i )
		{
			vec2 uv_d = aspect_r * hexagon[i];
			vec4 texel = texture2DLod( tTexture, sampleCoord + uv_d, uLOD );
			texel = formatInputColor( texel );
			texel.rgb *= texel.a;
			sum += texel;
		}	
		sum_w += 6.0;
	}
	//off-kilter hexel	
	{
		HINT_UNROLL
		for( int i=0; i<6; ++i )			
		{
			vec2 uv_d = aspect_r * hexagon[i].yx;
			vec4 texel = texture2DLod( tTexture, sampleCoord + uv_d, uLOD );
			texel = formatInputColor( texel );
			texel.rgb *= texel.a;
			sum += texel;
		}
		sum_w += 6.0;
	}
	sum /= sum_w;
	sum.rgb /= max(0.001, sum.a);
	sum = saturate( sum );
	
	vec4 sharp = saturate( origin + (origin - sum) * uAmount );
	
	///
	state.result = sharp;
	state.result = compositeLayerStateNoDither( state );
	OUT_COLOR0 = state.result; 
}
