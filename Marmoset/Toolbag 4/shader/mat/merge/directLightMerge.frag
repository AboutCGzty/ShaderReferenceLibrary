#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/shadowParams.sh"

void	DirectLightPremerge( inout FragmentState s )
{
	s.shadow = sampleShadowMask( s.screenTexCoord, 0.0 );
}

#define Premerge	DirectLightPremerge

void	DirectLightMerge( inout FragmentState s )
{
	s.output0.xyz =	s.diffuseLight + s.specularLight + s.emissiveLight;
	s.output0.w =	s.albedo.a;
}

#define Merge	DirectLightMerge
