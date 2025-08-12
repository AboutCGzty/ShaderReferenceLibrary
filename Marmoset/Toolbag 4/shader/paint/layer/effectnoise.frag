#include "gaussian.sh"
#include "layernoise.sh"
#include "effectperlinbase.frag"
#include "effectwarpcoords.frag"
#include "gradientmap.frag"

#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif

uniform int		uInvertEffect;
uniform float	uContrast;
uniform float	uScale;
uniform int		uSampling;
uniform float	uNoiseContrast;
uniform float	uLayerMultiplier;

uniform int		uFinalPass;

USE_TEXTURE2D( tTexture );


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

	vec4 perlinColor;

	#ifdef EFFECT_POSITIONAL
		#ifdef EFFECT_TRIPLANAR
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( sampleCoord );
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal, inputNormal );	
			#else
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			//float sx = getPerlin(applyWarp(p.uvX, uScale) * uScale, uSampling);
			//float sy = getPerlin(applyWarp(p.uvY, uScale) * uScale, uSampling);
			//float sz = getPerlin(applyWarp(p.uvZ, uScale) * uScale, uSampling);
			float sx = getPerlin(applyWarp(p.uvX * uScale, 1.0f), uSampling);
			float sy = getPerlin(applyWarp(p.uvY * uScale, 1.0f), uSampling);
			float sz = getPerlin(applyWarp(p.uvZ * uScale, 1.0f), uSampling);
			vec4 vx = vec4(sx, sx, sx, 1);
			vec4 vy = vec4(sy, sy, sy, 1);
			vec4 vz = vec4(sz, sz, sz, 1);
			perlinColor = triplanarMix( p, vx, vy, vz );
		#else
			//vec3 pos = fPosition * uScale;
			//pos = applyWarp3D(fPosition, uScale) * uScale;
			//float perlinValue = getPerlin3D(pos, uSampling);
			//perlinColor = vec4( perlinValue, perlinValue, perlinValue, 1.0 );		//monochrome perlin with an alpha of 1.0
			vec3 pos = fPosition * uScale;
			pos = applyWarp3D(fPosition * uScale, 1.0f);
			float perlinValue = getPerlin3D(pos, uSampling);
			perlinColor = vec4( perlinValue, perlinValue, perlinValue, 1.0 );			//monochrome perlin with an alpha of 1.0
		#endif
	#else
		//float perlinValue = getPerlin(applyTiledWarp(state.texCoord.xy * uScale, state.texCoord.xy, vec2(0, 0), uScale), uSampling);
		//perlinColor = vec4( perlinValue, perlinValue, perlinValue, 1.0 );			//monochrome perlin with an alpha of 1.0
		float perlinValue = getPerlin(applyWarp(state.texCoord * uScale, 1.0f), uSampling);
		perlinColor = vec4( perlinValue, perlinValue, perlinValue, 1.0 );			//monochrome perlin with an alpha of 1.0
	#endif

	perlinColor.x = 1.0f - ((1.0f - perlinColor.x)*uNoiseContrast);
	perlinColor.y = 1.0f - ((1.0f - perlinColor.y)*uNoiseContrast);
	perlinColor.z = 1.0f - ((1.0f - perlinColor.z)*uNoiseContrast);

	vec4 outputColor = texture2DLod( tTexture, sampleCoord, 0 );
	
	outputColor.x *= perlinColor.x;
	outputColor.y *= perlinColor.y;
	outputColor.z *= perlinColor.z;

	outputColor.w = 1;

	if( uFinalPass != 0 )
	{
		if( uInvertEffect != 0 )
		{
			outputColor.x = 1.0f-outputColor.x;
			outputColor.y = 1.0f-outputColor.y;
			outputColor.z = 1.0f-outputColor.z;
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

