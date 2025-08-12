#include "gaussian.sh"
#include "layernoise.sh"

#ifdef PREPASS
	#include "layerformat.sh"
#else
	#include "layer.sh"	
#endif

USE_TEXTURE2D( tTexture );
uniform vec2	uBlurKernel;	// (1/w, 1/h)
uniform vec3	uBlurBounds;	// (sigma, -radius + 0.5, radius + 0.5)
uniform vec3	uBlurNoise;		// (scale, seed offset)
uniform float	uStep;



BEGIN_PARAMS
INPUT0(vec2, fBufferCoord)
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;

	//sample offset noise for steps > 2
	const float noise = uBlurNoise.x * (2.0 * rand(sampleCoord + uBlurNoise.yz) - 1.0);
	
	const float sigma = uBlurBounds.x;
	const float gN = gaussianNorm(sigma);
	const float gP = gaussianPower(sigma*sigma);

	vec4 avg = vec4(0.0,0.0,0.0,0.0);
		
	HINT_LOOP
	for( float f = uBlurBounds.y; f < uBlurBounds.z; f += uStep )
	{
		float r = f + noise;
		#ifdef PREPASS
			vec2 uv_offset = vec2(0,r) * uBlurKernel;
			vec2 gs_offset = vec2(0,r);
		#else
			vec2 uv_offset = vec2(r,0) * uBlurKernel;
			vec2 gs_offset = vec2(r,0);
		#endif
				
		vec4 tap = texture2D( tTexture, sampleCoord + uv_offset );
		tap = formatInputColor( uInputFormat, tap );
		tap.rgb *= tap.a;
		avg += tap * gaussianCached( gN, gP, r*r ) * uStep;		
	}
	avg.rgb /= max(0.001, avg.a);
	avg.a = saturate( (avg.a*258.0 - 1.0) / 256.0 ); //gaussian bell curves rarely drop to 0.0 so alpha needs a clamp

	#ifdef PREPASS				
		OUT_COLOR0 = formatOutputPrepass( avg ); // prepass isn't actually a layer shader and needs to end up back in uInputFormat
	#else
		LayerState state = getLayerState( sampleCoord );
		state.result = avg;		
		state.result = compositeLayerState( state );
		OUT_COLOR0 = state.result; 
	#endif
}
