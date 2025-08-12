#include "data/shader/common/util.sh"
#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/remap.frag"

USE_TEXTURE_MATERIAL(_p(tSpecularMap));

uniform vec4	_p(uSpecularSwizzle);
uniform vec3	_p(uSpecularColor);
uniform uint	_p(uSpecularMapGrayscale);
uniform vec3	_p(uSpecularFresnel);
uniform float	_p(uSpecularConserve);

#if defined(MATERIAL_PASS_PAINT)
uniform float	_p(uMetalCenter);
uniform float	_p(uMetalRange);
#endif

void	ReflectivitySpecularMap( inout FragmentState s )
{
	vec4 t = textureMaterial( _p(tSpecularMap), s.vertexTexCoord );
	t = _p(uSpecularMapGrayscale) ? t.rrra : t;
	float swz = dot( t, _p(uSpecularSwizzle) );
	_p(s.reflectivity) = (_p(uSpecularSwizzle).x < 0.0) ? t.rgb : vec3(swz,swz,swz);
	_p(s.reflectivity) *= _p(uSpecularColor);
	_p(s.fresnel) = _p(uSpecularFresnel);

	float F0 = maxcomp( _p(s.reflectivity) );
	_p(s.eta) = remapReflectivityToEta( F0 );

	#if defined(MATERIAL_PASS_PAINT)
		#ifndef SUBROUTINE_SECONDARY
			vec3 metalSpec = saturate( ( saturate( s.reflectivity.xyz - vec3( 0.04, 0.04, 0.04 ) ) / saturate( s.albedo.xyz + vec3(.04, .04, .04) ) ) / .96 );
			float metal = max( metalSpec.r, max( metalSpec.g, metalSpec.b ) );
			float metalMin = saturate( _p(uMetalCenter) - _p(uMetalRange) );
			float metalMax = saturate( _p(uMetalCenter) );
			metal = clamp( ( metal - metalMin ) / ( metalMax - metalMin ), 0.0, 1.0 );
			s.metalness = metal;
			// specular color ends up in metalness base color for dielectrics
			s.baseColor = mix( s.albedo.rgb, _p(s.reflectivity.rgb), s.metalness ); 
		#endif
	#endif
	
	#if defined(MSET_RAYTRACING)
		//rt energy conservation
		HINT_FLATTEN if( _p(uSpecularConserve) > 0.0 )
		{
			#ifdef SUBROUTINE_SECONDARY
				s.metalness = max( s.metalness, remapReflectivityToMetalness( F0 ) );
			#else
				s.metalness = remapReflectivityToMetalness( F0 );
			#endif
		}
	#elif !defined(MATERIAL_PASS_PAINT)
		//raster energy conservation, skipping for paint & ray tracing
		float diffusion = saturate( 1.0 - _p(uSpecularConserve) * remapReflectivityToMetalness( F0 ) );
		s.albedo.rgb *= diffusion;
		s.sheen *= diffusion;
	#endif
	
	#if defined(MATERIAL_PASS_COMPONENTVIEW)
		#ifndef SUBROUTINE_SECONDARY
			s.metalness = remapReflectivityToMetalness( F0 );
		#endif
	#endif
}

#ifdef SUBROUTINE_SECONDARY
	#define	ReflectivitySecondary	ReflectivitySpecularMapSecondary
#else
	#define	Reflectivity			ReflectivitySpecularMap
#endif
