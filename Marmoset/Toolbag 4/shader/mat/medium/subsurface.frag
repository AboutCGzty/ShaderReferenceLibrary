uniform vec3	uScatterDepth;
uniform float	uScatterAnisotropy;
uniform uint	uScatterMapGrayscale;
USE_TEXTURE_MATERIAL(tScatterMap);

//see "Practical and Controllable Subsurface Scattering for Production Path Tracing", M. Chiang, P. Kutz, B. Burley.
void MediumSubsurface( inout FragmentState s )
{
	vec3 scatterMap = textureMaterial( tScatterMap, s.vertexTexCoord ).rgb;
	scatterMap = uScatterMapGrayscale ? scatterMap.rrr : scatterMap;

	vec3 A   = s.baseColor;
	vec3 a   = vec3(1.0,1.0,1.0) - exp( A * (-5.09406 + A * (2.61188 - A * 4.31805)) );
	vec3 mfp = uScatterDepth * scatterMap; //mean free path

	s.scatterDepth		= mfp;
	s.mediumExtinction	= rcp( max(mfp, 1e-4) );
	s.mediumScatter		= s.mediumExtinction * a;
	s.mediumAnisotropy	= uScatterAnisotropy;
}

#define Medium	MediumSubsurface
