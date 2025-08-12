#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/remap.frag"

USE_TEXTURE_MATERIAL(_p(tReflectivityIORMap));
#ifndef SUBROUTINE_SECONDARY
	USE_TEXTURE_MATERIAL(_p(tMetalnessMap));
#endif

uniform float	_p(uReflectivityIOR);
uniform float	_p(uReflectivityMediumIOR);
uniform vec4	_p(uReflectivityIORSwizzle);

#ifndef SUBROUTINE_SECONDARY
	uniform vec2 _p(uMetalnessScaleBias);
	uniform vec4 _p(uMetalnessSwizzle);
#endif

void	ReflectivityRefractiveIndex( inout FragmentState s )
{
	float i = dot( textureMaterial( _p(tReflectivityIORMap), s.vertexTexCoord ), _p(uReflectivityIORSwizzle) );
	i = i * _p(uReflectivityIOR);

#ifndef SUBROUTINE_SECONDARY
	float m = dot( textureMaterial( _p(tMetalnessMap), s.vertexTexCoord ), _p(uMetalnessSwizzle) );
	m = _p(uMetalnessScaleBias).x * m + _p(uMetalnessScaleBias).y;
#endif
	
	float eta = remapIORToEta( i, _p(uReflectivityMediumIOR) );
	vec3  F0  = remapEtaToReflectivity( eta );

#ifdef SUBROUTINE_SECONDARY
	_p(s.reflectivity) = F0;
#else
	_p(s.reflectivity) = mix( F0, s.albedo.rgb, m );
	s.metalness = m;
#endif
	_p(s.eta) = eta;

	//energy conservation (only for IOR<=1.5 to match metalness/specular)
	float diffusion = 1.0 - saturate( maxcomp( F0 ) - 0.04 );
#if defined(MSET_RAYTRACING)
	s.diffusion  *= diffusion;
#elif !defined(MATERIAL_PASS_PAINT)
	s.albedo.rgb *= diffusion;
	s.sheen *= diffusion;
	#ifndef SUBROUTINE_SECONDARY
		s.albedo.rgb *= saturate( 1.0 - m );
		s.sheen *= saturate( 1.0 - m );
	#endif
#endif

#if defined(MATERIAL_PASS_PAINT)
	#ifndef SUBROUTINE_SECONDARY
		// convert specular to a metalness value (constant 0.25 threshold for now)
		s.metalness = max(s.reflectivity.r, max(s.reflectivity.g, s.reflectivity.b));
		s.metalness = saturate((s.metalness - 0.25) * 10000.0);
		s.baseColor = mix( s.albedo.rgb, s.reflectivity, s.metalness );
	#endif
#endif
}

#ifdef SUBROUTINE_SECONDARY
	#define	ReflectivitySecondary	ReflectivityRefractiveIndexSecondary
#else
	#define	Reflectivity			ReflectivityRefractiveIndex
#endif
