#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/remap.frag"

USE_TEXTURE_MATERIAL(_p(tMetalnessMap));

#ifdef METALNESS_ADVANCED
	USE_TEXTURE_MATERIAL(_p(tSpecMap));

	uniform vec2	_p(uSpecScaleBias);
	uniform vec4	_p(uSpecSwizzle);
	uniform int		_p(uSpecCurveAdjust);
	uniform int		_p(uSpecConserve);
#endif

uniform vec2	_p(uMetalnessScaleBias);
uniform vec4	_p(uMetalnessSwizzle);

void	ReflectivityMetalness( inout FragmentState s )
{
	float m = dot( textureMaterial( _p(tMetalnessMap), s.vertexTexCoord ), _p(uMetalnessSwizzle) );
	m = _p(uMetalnessScaleBias).x * m + _p(uMetalnessScaleBias).y;
	
	float spec = 0.04;
	#ifdef METALNESS_ADVANCED
		spec = dot( textureMaterial( _p(tSpecMap), s.vertexTexCoord ), _p(uSpecSwizzle) );
		spec = (_p(uSpecCurveAdjust) > 0) ? (spec*spec) : spec;
		spec = _p(uSpecScaleBias).x * spec + _p(uSpecScaleBias).y;
	#endif

	_p(s.reflectivity) = mix( vec3(spec,spec,spec), s.albedo.rgb, m );
	_p(s.eta) = remapReflectivityToEta( spec );
	s.metalness = m;

	#ifdef METALNESS_ADVANCED
	HINT_FLATTEN if( _p(uSpecConserve) )
	{
		m = max( m, remapReflectivityToMetalness( spec ) );
	}
	#endif

	#if defined(MSET_RAYTRACING)
		//update metalness after energy conservation
		s.metalness = m;
	#elif !defined(MATERIAL_PASS_PAINT)
		s.albedo.xyz = s.albedo.xyz - m * s.albedo.xyz;
		s.sheen = s.sheen - m * s.sheen;
	#endif
}

#ifdef SUBROUTINE_SECONDARY
	#define	ReflectivitySecondary	ReflectivityMetalnessSecondary
#else
	#define	Reflectivity			ReflectivityMetalness
#endif
