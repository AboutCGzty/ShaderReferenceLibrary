#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tNewtonsRingsThicknessMap);
USE_TEXTURE2D(tNewtonsRingsInterference);

uniform float	uNewtonsRingsIntensity;
uniform vec2	uNewtonsRingsThickness;

vec3	NewtonsRings( in FragmentState s )
{
	//thickness is mask over value
	float thickness = textureMaterial( tNewtonsRingsThicknessMap, s.vertexTexCoord ).x;
	thickness = thickness*uNewtonsRingsThickness.x + uNewtonsRingsThickness.y;

	//find a multiple of the wavelenth at peak constructive interference;
	//use it to look into our spectrum. Given by:
	//	k * l = thickness / cos(theta)
	//where k is an integer, l is a given light wavelength,
	//and theta is the angle of incidence. -jdr
	float cosTheta = dot( s.vertexEye, s.normal );
	float wavelengthMult = thickness / cosTheta;
	vec3 interference = texture2D( tNewtonsRingsInterference, vec2(wavelengthMult,0.0) ).xyz;

	//a fresnel-like effect accompanies this
	float fade = 1.0 - cosTheta;
	fade *= fade; fade *= fade;
	fade = 1.0 - fade*fade;

	//blend based on artist specified intensity
	interference = mix( vec3(1.0,1.0,1.0), interference, uNewtonsRingsIntensity * fade );

	return interference;
}

#ifdef MSET_RAYTRACING

	#ifdef ReflectionEvaluate
		void	NewtonsRingsWrap( inout FragmentState fs, inout SampleState ss )
		{
			//Just wrapping the base ReflectionEvaluate,
			//so we can do our dirty deed to the bsdf. -jdr
			ReflectionEvaluate(fs,ss);

			if( isReflection(ss) )
			{
				vec3 rings = NewtonsRings(fs);
				ss.bsdf *= rings;
			}
		}
		#undef ReflectionEvaluate
		#define ReflectionEvaluate	NewtonsRingsWrap
	#endif

#else

	void	NewtonsRingsEnv( inout FragmentState s )
	{
		s.specularLight *= NewtonsRings(s);
	}
	#define	ReflectionEnvSecondary		NewtonsRingsEnv
	
#endif

