//inherits transmissivityBase

USE_TEXTURE_MATERIAL(tScatterFuzzMap);
uniform vec4		uScatterFuzz;
uniform uint		uScatterFuzzMapGrayscale;

void TransmissivitySubsurfaceScatter( inout FragmentState s )
{
	float t = TransmissivityBase( s );

	vec3 fuzzMap = textureMaterial( tScatterFuzzMap, s.vertexTexCoord ).rgb;
	fuzzMap = uScatterFuzzMapGrayscale ? fuzzMap.rrr : fuzzMap;
	
	s.transmissivity  = vec3( t, t, t ) * s.diffusion;
	s.fuzz			  = uScatterFuzz.rgb * fuzzMap;
	s.fuzzGlossMask	  = uScatterFuzz.a > 0.0;
	s.diffusion		 *= 1.0 - t;
}

#define Transmissivity	TransmissivitySubsurfaceScatter
