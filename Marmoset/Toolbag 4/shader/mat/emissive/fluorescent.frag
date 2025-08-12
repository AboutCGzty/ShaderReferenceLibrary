#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(uFluorescentMap);

uniform vec3	uFluorescentColor;
uniform float	uFluorescentSphere[9];

void	EmissiveFluorescentImage( inout FragmentState s )
{
	float e = uFluorescentSphere[0];

	e += uFluorescentSphere[1] * s.normal.y;
	e += uFluorescentSphere[2] * s.normal.z;
	e += uFluorescentSphere[3] * s.normal.x;

	vec3 swz = s.normal.yyz * s.normal.xzx;
	e += uFluorescentSphere[4] * swz.x;
	e += uFluorescentSphere[5] * swz.y;
	e += uFluorescentSphere[7] * swz.z;

	vec3 sqr = s.normal * s.normal;
	e += uFluorescentSphere[6] * ( 3.0*sqr.z - 1.0 );
	e += uFluorescentSphere[8] * ( sqr.x - sqr.y );

	s.emissiveLight += uFluorescentColor * textureMaterial(uFluorescentMap,s.vertexTexCoord).xyz * e;
}

#define	Emissive	EmissiveFluorescentImage