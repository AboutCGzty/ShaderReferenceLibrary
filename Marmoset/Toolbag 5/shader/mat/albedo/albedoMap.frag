#include "data/shader/mat/state.frag"

struct  AlbedoMapParams
{
	uint		texture;
	packed_vec3	color;
};
void    AlbedoMap( in AlbedoMapParams p, inout MaterialState m, in FragmentState s )
{
	m.albedo       = textureMaterial( p.texture, m.vertexTexCoord, vec4(1.0,1.0,1.0,1.0) );
	m.hairAlbedo   = m.albedo.rgb;
	m.hairTint     = p.color;

	m.albedo.rgb  *= p.color;
	m.scatterColor = m.albedo.rgb;
}

void	AlbedoMapMerge( in MaterialState m, inout FragmentState s )
{
	s.albedo	 = m.albedo;
	s.hairAlbedo = m.hairAlbedo;
	s.hairTint   = m.hairTint;
	s.baseColor = m.albedo.rgb; // Painting requires raw albedo value
}

#define AlbedoParams		AlbedoMapParams
#define Albedo(p,m,s)		AlbedoMap(p.albedo,m,s)
#define AlbedoMerge			AlbedoMapMerge
#define AlbedoMergeFunction	AlbedoMapMerge
