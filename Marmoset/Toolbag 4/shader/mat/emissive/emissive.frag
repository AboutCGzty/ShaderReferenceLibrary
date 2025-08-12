#include "data/shader/mat/state.frag"

uniform vec3	uEmissiveColor;
uniform uint	uEmissiveMapGrayscale;
uniform vec3	uEmission;
uniform float	uEmissionUseSecondaryUV;
USE_TEXTURE_MATERIAL(tEmissiveMap);

void	EmssiveMap( inout FragmentState s )
{
	vec2 tc = mix( s.vertexTexCoord, s.vertexTexCoordSecondary, uEmissionUseSecondaryUV );
	vec3 emissiveMap = textureMaterial( tEmissiveMap, tc ).xyz;
	emissiveMap = uEmissiveMapGrayscale ? emissiveMap.rrr : emissiveMap;
	s.emissiveLight += uEmission + emissiveMap * uEmissiveColor;
}

#define	Emissive	EmssiveMap