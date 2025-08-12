#include "data/shader/mat/state.frag"

uniform vec4	uWireframeColor;

void	WireframeMerge( inout FragmentState s )
{
	s.output0 = uWireframeColor;
}

#define	Merge	WireframeMerge