#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tScatterMap);
USE_TEXTURE_MATERIAL(tFuzzMap);

uniform uint	uScatterMapGrayscale;
uniform vec4	uScatterColor;

void	DiffusionScatterExport( inout FragmentState s )
{
	float t = TransmissivityBase(s);

	vec4 scatterMap = textureMaterial( tScatterMap, s.vertexTexCoord );
	scatterMap = uScatterMapGrayscale ? scatterMap.rrra : scatterMap;
	s.generic0.rgb = uScatterColor.rgb * scatterMap.rgb * t;
	s.generic0.a = scatterMap.a;

	//translucencyColor
	//vec4 translucencyMap = textureMaterial( tTranslucencyMap, s.vertexTexCoord );
	s.generic1.rgb = vec3(t,t,t);
	s.generic1.a = 1.0;

	//fresnelColor uniform is not baked in to handle values >1.0
	vec4 fuzzMap = textureMaterial( tFuzzMap, s.vertexTexCoord );
	s.generic2.rgb = fuzzMap.rgb;
	s.generic2.a = 1.0;
}

#define	Diffusion	DiffusionScatterExport