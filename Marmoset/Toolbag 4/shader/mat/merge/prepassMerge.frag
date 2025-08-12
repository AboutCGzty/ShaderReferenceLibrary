#include "data/shader/mat/state.frag"
#include "../fresnel.frag"
#include "../../common/util.sh"

#ifndef USE_OUTPUT1
	#define	USE_OUTPUT1
#endif

#ifndef USE_OUTPUT2
	#define	USE_OUTPUT2
#endif

#ifndef USE_OUTPUT3
	#define	USE_OUTPUT3
#endif

#ifndef USE_OUTPUT4
	#define	USE_OUTPUT4
#endif

uniform uint	uPrepassHasReflection;
uniform uint	uPrepassHasDiffusion;

void	PrepassMerge( inout FragmentState s )
{
	//normal & misc scalar
	s.output0.xyz = s.normal;
	s.output0.w = s.generic0.x;

	//view space depth
	s.output1.x = s.vertexPosition.z;

	//view space vertex normal (packed to preserve sign)
	s.output2.xyz = s.vertexNormal.xyz * 0.5 + 0.5;
	s.output2.w = 0.0;

	//reflectivity / gloss
	if( uPrepassHasReflection )
	{ s.output3.rgb = fresnelSchlick( s.reflectivity, s.fresnel, dot(s.vertexEye,s.normal) ); }
	else
	{ s.output3.rgb = vec3( 0.0, 0.0, 0.0 ); }
	s.output3.a = s.gloss;

	//albedo
	if( uPrepassHasDiffusion )
	{ s.output4.rgb = s.albedo.rgb; }
	else
	{ s.output4.rgb = vec3(0.0, 0.0, 0.0); }
	s.output4.a = 1.0;
}

#define	Merge	PrepassMerge