
#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif

#include "gradientmap.frag"

uniform vec3	uDirection;
uniform int		uObjectSpace;
uniform int		uTangentSpace;
uniform float	uInputMapIntensity;
uniform float	uInputMapContrast;
uniform float	uInputMapContrastCenter;


#if defined(INPUT_NORMAL_OBJECT)
	float objFunction( vec4 sample )
	{
		vec3 N = (uInputNormalObjectScale * sample.xyz) + uInputNormalObjectBias;		
		return dot( N, uDirection ) * 0.5 + 0.5; 
	}

	#define PROCESSOR_NAME	ObjNorm
	#define PROCESSOR_FUNC	objFunction
	#include "processor.sh"

	float getNormalsObjectValue(vec2 sampleCoord)
	{
		float value = processObjNorm( sampleCoord );
		return value;
	}

#elif defined(INPUT_NORMAL)		
	#define PROCESSOR_NAME	TangentNorm
	#include "processor.sh"

	//NOTE: Unlike object normals, this is a pass-through processor with no sampler function. The normal map gets
	// sampled, blurred, contrasted in tangent-scale/bias space and then objectified at the end.

	float getTangentNormalsValue(vec2 sampleCoord, vec3 normal, vec3 tangent, vec3 bitang)
	{
		vec4 texel = processV4TangentNorm( sampleCoord );
		vec3 N = (uInputNormalScale * texel.xyz) + uInputNormalBias;

		// to object space		
		float l = length(tangent);
		if(l > 0.0001)
		{ tangent /= l; }
		l = length(bitang);
		if(l > 0.0001)
		{ bitang /= l; }
		N = normalize(N.x * tangent + N.y * bitang + N.z * normal);

		float value = dot( N, uDirection ) * 0.5 + 0.5;
		return value;
	}
#endif

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
		#if defined(INPUT_NORMAL_OBJECT)
			value = getNormalsObjectValue( state.texCoord );
		#elif defined(INPUT_NORMAL)
			value = getTangentNormalsValue( state.texCoord, fNormal, fTangent, fBitangent );			
		#endif
	#else
		#if defined(INPUT_NORMAL_OBJECT)
			value = getNormalsObjectValue( state.texCoord );
		#endif
		//@@@ TODO: tangent space direction?
	#endif

	value = saturate( (value - uInputMapContrastCenter) * uInputMapContrast + uInputMapContrastCenter );
	value = mix( 0.0, value, uInputMapIntensity );

	state.result = vec4( value, value, value, 1.0 );	
	state.result = applyGradientMap(state.result);

	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}
