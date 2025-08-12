#include "data/shader/mat/state.frag"
#include "data/shader/mat/light.frag"

void	LightMerge( inout FragmentState s )
{
	s.output0.xyz =	s.diffuseLight + s.specularLight + s.emissiveLight;
	s.output0.w =	1.0;

	#ifdef LightMerge_AlphaOut
		s.output0.w = s.albedo.a;
	#endif
}

#define	Merge	LightMerge