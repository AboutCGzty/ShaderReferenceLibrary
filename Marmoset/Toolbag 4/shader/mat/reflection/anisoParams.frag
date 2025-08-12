#if !defined(ANISO_PARAMS_FRAG) || defined(SUBROUTINE_SECONDARY)
#define ANISO_PARAMS_FRAG

#include "data/shader/common/tangentbasis.sh"

#ifndef _p
	//included by non-reflection subroutine; define _p manually
	#define _p(name) name
	#define _p_defined
#endif

uniform vec4	_p(uAnisoRotation);
uniform vec2	_p(uAnisoDirectionMapScaleBias);
uniform vec2	_p(uAnisoAspect);
uniform float	_p(uAnisoDither);
uniform float	_p(uReflectionBrightness);

USE_TEXTURE_MATERIAL(_p(tAnisoDirectionMap));

#ifndef REFLECTION_CUBE_MAP
#define REFLECTION_CUBE_MAP
USE_TEXTURECUBE(tReflectionCubeMap);
#endif

void	_p(anisoRoughnessToA)( float roughness, out float a, out float ax, out float ay )
{
	//convert roughness value to 'a' values needed by BRDF
	float r2 = roughness * roughness;
	float minA = 1e-4;
	a  = max( r2, minA );
	ax = max( r2 * _p(uAnisoAspect).x, minA );
	ay = max( r2 * _p(uAnisoAspect).y, minA );
}

void	_p(anisoGetBasis)( inout FragmentState s, out vec3 tangent, out vec3 bitangent )
{
	//sample direction map
	tangent.xy = textureMaterial( _p(tAnisoDirectionMap), s.vertexTexCoord ).xy;
	tangent.xy = _p(uAnisoDirectionMapScaleBias).x * tangent.xy + _p(uAnisoDirectionMapScaleBias).y;
	
	//rotate tangent
	tangent.xy = tangent.x * _p(uAnisoRotation).xy + tangent.y * _p(uAnisoRotation).zw;

	//transform into render space
	tangent =	tangent.x * s.vertexTangent +
				tangent.y * s.vertexBitangent;

	//project tangent onto normal plane
	tangent = tangent - s.normal*dot( tangent, s.normal );
	tangent = normalize( tangent );
	bitangent = cross( s.normal, tangent );

	s.anisoTangent = tangent;
}

void	_p(anisoGetBasis)( vec2 vertexTexCoord, TangentBasis basis, out vec3 tangent, out vec3 bitangent )
{
	//sample direction map
	tangent.xy = textureMaterial( _p(tAnisoDirectionMap), vertexTexCoord ).xy;
	tangent.xy = _p(uAnisoDirectionMapScaleBias).x * tangent.xy + _p(uAnisoDirectionMapScaleBias).y;
	
	//rotate tangent
	tangent.xy = tangent.x * _p(uAnisoRotation).xy + tangent.y * _p(uAnisoRotation).zw;

	//transform into render space
	tangent    = normalize( basis.T * tangent.x + basis.B * tangent.y );
	bitangent  = cross( basis.N, tangent );
}

#ifdef _p_defined
	#undef _p
	#undef _p_defined
#endif

#endif