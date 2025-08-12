#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tAlphaMap);

uniform vec4	uAlphaSwizzle;
uniform vec2	uUseAlbedoAlpha;

void	AlphaBase( inout FragmentState s )
{
	//retain or discard alpha from albedo channel; also applies scale
	s.albedo.a = saturate( s.albedo.a * uUseAlbedoAlpha.x + uUseAlbedoAlpha.y );

	//multiply on our custom texture
	s.albedo.a *= dot( textureMaterial( tAlphaMap, s.vertexTexCoord ), uAlphaSwizzle );
}

#define ALPHABASE