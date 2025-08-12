#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tAlbedoMap);
uniform uint	uAlbedoMapGrayscale;
uniform vec3	uAlbedoMapColor;

void	AlbedoMap( inout FragmentState s )
{
	s.albedo = textureMaterial( tAlbedoMap, s.vertexTexCoord );
	s.albedo = uAlbedoMapGrayscale ? s.albedo.rrra : s.albedo;
	s.albedo.xyz *= uAlbedoMapColor;
	s.baseColor = s.albedo.xyz;
}

#define	Albedo	AlbedoMap