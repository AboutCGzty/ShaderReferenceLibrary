#include "gaussian.sh"
#include "layernoise.sh"
#include "gradientmap.frag"
#include "effectperlinbase.frag"
#include "effectwarpcoords.frag"

#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif

uniform float	uContrast;
uniform float	uScale;
uniform int		uInvertEffect;
uniform float	uGranularity;
uniform float	uGrainMin;
uniform float	uLayerMultiplier;

uniform int		uFinalPass;


USE_TEXTURE2D( tTexture );

float accumNoise2D(vec2 co, float lastValue)
{
	float tvalue = perlinBicubic(co.x, co.y);
	tvalue = lerp(1.0, tvalue, lerp(uGrainMin, 1.0, uGranularity));
	lastValue *= tvalue;
	return lastValue;
}

float accumNoise2DRepeat(vec2 co, float lastValue)
{
	float tvalue = perlinBicubicRepeat(co.x, co.y);
	tvalue = lerp(1.0, tvalue, lerp(uGrainMin, 1.0, uGranularity));
	lastValue *= tvalue;
	return lastValue;
}

float accumNoise3D(vec3 co, float lastValue)
{
	float tvalue = perlin3DValue(co.x, co.y, co.z);
	tvalue = lerp(1.0, tvalue, lerp(uGrainMin, 1.0, uGranularity));
	lastValue *= tvalue;
	return lastValue;
}

BEGIN_PARAMS
	INPUT0( vec2, fBufferCoord )
#ifdef EFFECT_POSITIONAL
	INPUT1( vec3, fPosition )
	INPUT3( vec3, fNormal )
	INPUT4( vec3, fTangent )
	INPUT5( vec3, fBitangent )	
#endif
	OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 sampleCoord = fBufferCoord;

	LayerState state = getLayerState( sampleCoord );

	vec4 outputColor = texture2DLod( tTexture, sampleCoord, 0 );
	float lastValue = outputColor.x * 1.0;

	#ifdef EFFECT_POSITIONAL
		#ifdef EFFECT_TRIPLANAR
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( sampleCoord );
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal, inputNormal );	
			#else
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			
			//float sx = accumNoise2D(applyWarp(p.uvX, uScale)*uScale, lastValue);
			//float sy = accumNoise2D(applyWarp(p.uvY, uScale)*uScale, lastValue);
			//float sz = accumNoise2D(applyWarp(p.uvZ, uScale)*uScale, lastValue);
			
			float sx = accumNoise2D(applyWarp(p.uvX, 1.0)*uScale, lastValue);
			float sy = accumNoise2D(applyWarp(p.uvY, 1.0)*uScale, lastValue);
			float sz = accumNoise2D(applyWarp(p.uvZ, 1.0)*uScale, lastValue);

			vec4 vx = vec4(sx, sx, sx, 1);
			vec4 vy = vec4(sy, sy, sy, 1);
			vec4 vz = vec4(sz, sz, sz, 1);
			outputColor = triplanarMix( p, vx, vy, vz );
		#else
			//float value = accumNoise3D(applyWarp3D(fPosition, uScale)*uScale, lastValue);
			float value = accumNoise3D(applyWarp3D(fPosition, 1.0)*uScale, lastValue);
			outputColor.x = value;
			outputColor.y = value;
			outputColor.z = value;
			outputColor.w = 1;
		#endif
	#else
		//float value = accumNoise2DRepeat(applyTiledWarp(state.texCoord.xy, state.texCoord.xy, vec2(0, 0), uScale) * uScale, lastValue);
		float value = accumNoise2DRepeat(applyWarp(state.texCoord.xy, 1.0)*uScale, lastValue);
		outputColor.x = value;
		outputColor.y = value;
		outputColor.z = value;
		outputColor.w = 1;
	#endif

	outputColor.w = 1;
	
	if( uFinalPass != 0 )
	{
		if( uInvertEffect != 0 )
		{
			outputColor.x = 1.0-outputColor.x;
			outputColor.y = 1.0-outputColor.y;
			outputColor.z = 1.0-outputColor.z;
		}
		//monochrome with an alpha of 1.0
		outputColor *= uLayerMultiplier;
		outputColor = lerp( vec4(0.5,0.5,0.5,1.0), outputColor, uContrast );		//amount is noise contrast, i.e. lerp between flat gray and noise
		outputColor.w = 1;
		outputColor = applyGradientMap(outputColor);
		state.result = outputColor;
		state.result = compositeLayerState( state );//composite on final pass only
		OUT_COLOR0 = state.result;
	}
	else
	{
		OUT_COLOR0 = outputColor;
	}
}
