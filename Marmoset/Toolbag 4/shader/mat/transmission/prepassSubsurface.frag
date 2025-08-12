#include "data/shader/mat/state.frag"

uniform float	uTranslucencyDepth;

void	PrepassSubsurface( inout FragmentState s )
{
	s.generic0.x = uTranslucencyDepth;
}

#define	Diffusion	PrepassSubsurface