#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/lightParams.frag"
#include "data/shader/mat/other/shadowParams.frag"

uniform vec4	uDiffuseLightSphere[9];

void	DiffusionLambertianEnv( inout FragmentState s )
{
	//l = 0 band
	vec3 d = uDiffuseLightSphere[0].xyz;

	//l = 1 band
	d += uDiffuseLightSphere[1].xyz * s.normal.y;
	d += uDiffuseLightSphere[2].xyz * s.normal.z;
	d += uDiffuseLightSphere[3].xyz * s.normal.x;

	//l = 2 band
	vec3 swz = s.normal.yyz * s.normal.xzx;
	d += uDiffuseLightSphere[4].xyz * swz.x;
	d += uDiffuseLightSphere[5].xyz * swz.y;
	d += uDiffuseLightSphere[7].xyz * swz.z;

	vec3 sqr = s.normal * s.normal;
	d += uDiffuseLightSphere[6].xyz * ( 3.0*sqr.z - 1.0 );
	d += uDiffuseLightSphere[8].xyz * ( sqr.x - sqr.y );

	//apply albedo & add
	s.diffuseLight += s.albedo.xyz * d;
}
#define	DiffusionEnv	DiffusionLambertianEnv


void	DiffusionLambertianLight( inout FragmentState s, LightParams l )
{
	adjustAreaLightDiffuse( l, s.vertexPosition );
	
	float lambert =  saturate( (1.0/3.1415926) * dot(s.normal, l.direction) );

	s.diffuseLight +=	(lambert * l.attenuation) *
						(l.color * l.shadow.rgb) *
						s.albedo.xyz;
}
#ifndef Diffusion
#define	Diffusion	DiffusionLambertianLight
#endif