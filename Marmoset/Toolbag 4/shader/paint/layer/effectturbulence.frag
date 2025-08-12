#include "gaussian.sh"
#include "layernoise.sh"
#include "turbulence.frag"
#include "effectwarpcoords.frag"
#include "gradientmap.frag"

#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif

uniform int		uInvertEffect;
uniform float	uContrast;

uniform float	uNoiseAmplitude;
uniform float	uNoiseFrequency;
uniform float	uNoiseContrast;
uniform float	uLayerMultiplier;

uniform float	uScale;

uniform int		uFinalPass;


USE_TEXTURE2D( tTexture );

/*float getNoiseSample(vec2 uv)
{
	return getTurbulence(uv, uNoiseFrequency, uNoiseAmplitude);
}

float getNoiseSample3D(vec3 pos)
{
	return getTurbulence3D(pos, uNoiseFrequency, uNoiseAmplitude);
}*/

float getNoiseSample(vec2 uv)
{
	return getTurbulence(uv + vec2(uRandomSeedValue, uRandomSeedValue), uNoiseFrequency, uNoiseAmplitude);
}

float getNoiseSample3D(vec3 pos)
{
	return getTurbulence3D(pos + vec3(uRandomSeedValue, uRandomSeedValue, uRandomSeedValue), uNoiseFrequency, uNoiseAmplitude);
}

float generateSample(vec2 uv)
{
	if( uWarpAmplitude != 0 )
	{
		uv = applyWarp(uv, 1.0f);
	}
	float result = getNoiseSample(uv);
	return result;
}

float generateSample3D(vec3 pos)
{
	if( uWarpAmplitude != 0 )
	{
		pos = applyWarp3D(pos, 1.0f);
	}
	float result = getNoiseSample3D(pos);
	return result;
}

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

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

	float value = 1.0;

	#ifdef EFFECT_POSITIONAL
		#ifdef EFFECT_TRIPLANAR
			//tri-planar sample		
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( sampleCoord );
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal, inputNormal );	
			#else
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			//float sx = getNoiseSample( applyWarp(p.uvX + vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale );
			//float sy = getNoiseSample( applyWarp(p.uvY + vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale );
			//float sz = getNoiseSample( applyWarp(p.uvZ + vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale );
			float sx = generateSample( p.uvX * uScale );
			float sy = generateSample( p.uvY * uScale );
			float sz = generateSample( p.uvZ * uScale );
			vec4 vx = vec4(sx, sx, sx, 1);
			vec4 vy = vec4(sy, sy, sy, 1);
			vec4 vz = vec4(sz, sz, sz, 1);
			value = triplanarMix( p, vx, vy, vz ).x;
		#else
			//3d sample
			//value = getNoiseSample3D( applyWarp3D(fPosition + vec3(uRandomSeedValue, uRandomSeedValue, uRandomSeedValue), uScale) * uScale );		
			value = generateSample3D(fPosition * uScale);
		#endif		
	#else
	//2d sample
	{
		//value = getNoiseSample(applyTiledWarp(state.texCoord.xy + vec2(uRandomSeedValue, uRandomSeedValue), state.texCoord.xy, vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale);
		value = generateSample(sampleCoord * uScale);
	}
	#endif

	value = 1.0f - ((1.0f - value)*uNoiseContrast);

	vec4 outputColor = texture2DLod( tTexture, sampleCoord, 0 );
	outputColor.x *= value;
	outputColor.y *= value;
	outputColor.z *= value;
	outputColor.w = 1.0;

	if( uFinalPass != 0 )
	{
		if( uInvertEffect != 0 )
		{
			outputColor.x = 1.0-outputColor.x;
			outputColor.y = 1.0-outputColor.y;
			outputColor.z = 1.0-outputColor.z;
		}
		//monochrome with an alpha of 1.0
		outputColor = lerp( vec4(0.5,0.5,0.5,1.0), outputColor, uContrast );		//amount is noise contrast, i.e. lerp between flat gray and noise
		outputColor *= uLayerMultiplier;
		outputColor.w = 1.0;
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

