#include "gaussian.sh"
#include "layernoise.sh"
#include "effectperlinbase.frag"
#include "effectwarpcoords.frag"
#include "gradientmap.frag"
#include "cellular.frag"
#include "phase.frag"

#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif


uniform int		uInvertEffect;
uniform float	uBrightness;
uniform float	uContrast;
uniform float	uScale;
uniform float	uJitter;
uniform float	uSmoothing;
uniform float	uPhase;

uniform float	uStartValue;
uniform float	uEndValue;


vec2 wrapCoordinates(vec2 uv)
{
	if( uv.x < 0 ) uv.x += ((int)((-uv.x/uScale)+1.0f))*uScale;
	if( uv.y < 0 ) uv.y += ((int)((-uv.y/uScale)+1.0f))*uScale;
	uv.x = fmod(uv.x, uScale);
	uv.y = fmod(uv.y, uScale);
	return uv;
}

float getNoiseSample(vec2 uv)
{
	vec2 value = cellular(uv, uJitter);
	float dots = smoothstep(uStartValue, uEndValue, value.x);
	float n = value.y-value.x;
	float result = n * dots;
	return phaseValue(result, uPhase, uSmoothing);
}

float getNoiseSample3D(vec3 pos)
{
	vec2 value = cellular3D(pos, uJitter);
	float dots = smoothstep(uStartValue, uEndValue, value.x);
	float n = value.y-value.x;
	float result = n * dots;
	return phaseValue(result, uPhase, uSmoothing);
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

	vec4 outputColor = vec4(0.0, 0.0, 0.0, 0.0);

	#ifdef EFFECT_POSITIONAL
		#ifdef EFFECT_TRIPLANAR
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( sampleCoord );
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal, inputNormal );	
			#else
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			//float sx = generateSample( applyWarp(p.uvX + vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale );
			//float sy = generateSample( applyWarp(p.uvY + vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale );
			//float sz = generateSample( applyWarp(p.uvZ + vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale );
			float sx = generateSample( (p.uvX + vec2(uRandomSeedValue, uRandomSeedValue)) * uScale);
			float sy = generateSample( (p.uvY + vec2(uRandomSeedValue, uRandomSeedValue)) * uScale);
			float sz = generateSample( (p.uvZ + vec2(uRandomSeedValue, uRandomSeedValue)) * uScale);
			vec4 vx = vec4(sx, sx, sx, 1);
			vec4 vy = vec4(sy, sy, sy, 1);
			vec4 vz = vec4(sz, sz, sz, 1);
			outputColor = triplanarMix( p, vx, vy, vz );
		#else
			//float value = generateSample3D(applyWarp3D(fPosition + vec3(uRandomSeedValue, uRandomSeedValue, uRandomSeedValue), uScale) * uScale);
			float value = generateSample3D((fPosition + vec3(uRandomSeedValue, uRandomSeedValue, uRandomSeedValue))* uScale);
			outputColor.x = value;
			outputColor.y = value;
			outputColor.z = value;
		#endif
	#else
		//float value = generateSample(applyTiledWarp(state.texCoord.xy, state.texCoord.xy, vec2(uRandomSeedValue, uRandomSeedValue), uScale) * uScale);
		float value = generateSample((state.texCoord.xy + vec2(uRandomSeedValue, uRandomSeedValue))* uScale);
		outputColor.x = value;
		outputColor.y = value;
		outputColor.z = value;
	#endif

	outputColor.xyz *= uBrightness;

	if( uInvertEffect != 0 )
	{
		outputColor.x = 1.0f-outputColor.x;
		outputColor.y = 1.0f-outputColor.y;
		outputColor.z = 1.0f-outputColor.z;
	}

	outputColor = lerp( vec4(0.5,0.5,0.5,1.0), outputColor, uContrast );		//amount is noise contrast, i.e. lerp between flat gray and noise
	outputColor = applyGradientMap(outputColor);
	outputColor.w = 1;

	state.result = outputColor;
	state.result = compositeLayerState( state );	
	OUT_COLOR0 = state.result;
}

