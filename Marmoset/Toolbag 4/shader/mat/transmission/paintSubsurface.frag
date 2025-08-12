#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tScatterMap);
USE_TEXTURE_MATERIAL(tFuzzMap);

uniform uint	uScatterMapGrayscale;
uniform vec4	uScatterColor;
uniform vec4	uScatterFuzz;
uniform uint	uScatterFuzzMapGrayscale;

void	DiffusionScatterPaint( inout FragmentState s )
{
	float t = TransmissivityBase(s);

	//translucencyColor	
	s.transmissivity = vec3( t, t, t );
		
	vec4 scatterMap;
	scatterMap = textureMaterial( tScatterMap, s.vertexTexCoord );
	scatterMap = uScatterMapGrayscale ? scatterMap.rrra : scatterMap;	
	s.scatterColor.rgb = uScatterColor.rgb * scatterMap.rgb * t;
	
	vec3 fuzzMap;
	fuzzMap			= textureMaterial( tFuzzMap, s.vertexTexCoord ).rgb;
	fuzzMap			= uScatterFuzzMapGrayscale ? fuzzMap.rrr : fuzzMap;
	s.fuzz			= uScatterFuzz.rgb * fuzzMap;
	s.fuzzGlossMask	= uScatterFuzz.a > 0.0;
}

#define	Diffusion	DiffusionScatterPaint