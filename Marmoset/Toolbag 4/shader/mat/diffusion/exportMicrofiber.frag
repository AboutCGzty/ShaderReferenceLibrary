#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tSheenMap);
uniform vec4	uSheenColor;
uniform uint	uSheenGrayscale;

void	DiffusionMicrofiberExport( inout FragmentState s )
{
	vec3 sheenMap = textureMaterial( tSheenMap, s.vertexTexCoord ).rgb;
	sheenMap = uSheenGrayscale ? sheenMap.rrr : sheenMap;
	sheenMap *= uSheenColor.rgb;

	s.generic2.rgb = sheenMap;
	s.generic2.a = 1.0;
}

#define	Diffusion	DiffusionMicrofiberExport