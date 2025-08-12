//inherits transmissivityBase

USE_TEXTURE_MATERIAL(tScatterMap);
uniform vec3  	uScatterDepth;
uniform uint	uScatterMapGrayscale;

uniform vec4	uScatterFuzz;
uniform uint	uScatterFuzzMapGrayscale;
USE_TEXTURE_MATERIAL(tScatterFuzzMap);

void TransmissivitySubsurfaceDiffusion( inout FragmentState s )
{
	if( !s.allowSubsurfaceDiffusion )
	{ return; }

	float t = TransmissivityBase( s );

	vec3 scatterMap = textureMaterial( tScatterMap, s.vertexTexCoord ).rgb;
	scatterMap = uScatterMapGrayscale ? scatterMap.rrr : scatterMap;

	vec3 fuzzMap	= textureMaterial( tScatterFuzzMap, s.vertexTexCoord ).rgb;
	fuzzMap = uScatterFuzzMapGrayscale ? fuzzMap.rrr : fuzzMap;

	s.transmissivity  = vec3( t, t, t ) * s.diffusion;
	s.fuzz			  = uScatterFuzz.rgb * fuzzMap;
	s.fuzzGlossMask	  = uScatterFuzz.a > 0.0;
	s.diffusion		 *= 1.0 - t;
	s.scatterColor    = scatterMap; //needed for PaintMerge

	vec3 mfp = uScatterDepth * scatterMap; //mean free path

	//derive scatter depth (d) via diffuse surface transmission curve fit
	//see "Approximate Reflectance Profiles for Efficient Subsurface Scattering", section 4
	vec3 A  = s.baseColor;
	vec3 A1 = A - vec3(0.8, 0.8, 0.8);
	vec3 sh = vec3(1.9, 1.9, 1.9) - A + 3.5 * A1 * A1;
	s.scatterDepth = max( mfp * rcp( sh ), 1e-4 );
}

#define Transmissivity		TransmissivitySubsurfaceDiffusion
