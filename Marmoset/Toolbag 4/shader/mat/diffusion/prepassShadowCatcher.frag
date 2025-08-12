#include "data/shader/mat/state.frag"

void	PrepassShadowCatcher( inout FragmentState s )
{
	//prevent 'shininess' from being written during the prepass
	s.reflectivity = vec3(0.0,0.0,0.0);
	s.gloss = 1.0;
}

#define	Diffusion	PrepassShadowCatcher