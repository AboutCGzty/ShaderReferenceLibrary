#include "hit.frag"

void	AlphaMaskIntersection( inout BakeHit h )
{
	h.output0.xyz = vec3( 1.0, 1.0, 1.0 );
}

#define Intersection	AlphaMaskIntersection