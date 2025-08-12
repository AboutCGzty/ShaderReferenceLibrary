//inherits transmissivityBase

USE_TEXTURE_MATERIAL(tScatterFuzzMap);
uniform vec4	uScatterFuzz;
uniform uint	uScatterFuzzMapGrayscale;

void TransmissivitySubsurfaceRaster( inout FragmentState s )
{
	float t = TransmissivityBase( s );
	
	s.transmissivity = vec3( t, t, t );
	s.fuzz			 = uScatterFuzz.rgb * textureMaterial( tScatterFuzzMap, s.vertexTexCoord ).xyz;
	s.fuzz			 = uScatterFuzzMapGrayscale ? s.fuzz.rrr : s.fuzz;
	s.fuzzGlossMask  = uScatterFuzz.a > 0.0;
	s.sheen         *= 1.0 - t;
}

#define Transmissivity		TransmissivitySubsurfaceRaster
