#include "data/shader/mat/state.frag"

struct TransparencyAlphaParams
{
	uint    texture;
	float   alpha;
};
void	TransparencyAlpha( in TransparencyAlphaParams p, inout MaterialState m, in FragmentState s )
{
	bool useAlbedoAlpha = p.alpha < 0.0;
	m.albedo.a  = useAlbedoAlpha ? m.albedo.a * abs(p.alpha) : p.alpha;
	m.albedo.a *= textureMaterial( p.texture, m.vertexTexCoord, 1.0 );
}

void	TransparencyAlphaMerge( in MaterialState m, inout FragmentState s )
{
	s.albedo.a = m.albedo.a;
}

#define TransparencyParams				TransparencyAlphaParams
#define Transparency(p,m,s)				TransparencyAlpha(p.transparency,m,s)

//if no albedo subroutine is present provide a merge function to write-out alpha
#ifndef AlbedoMerge
#define AlbedoMerge						TransparencyAlphaMerge
#define AlbedoMergeFunction				TransparencyAlphaMerge
#endif
