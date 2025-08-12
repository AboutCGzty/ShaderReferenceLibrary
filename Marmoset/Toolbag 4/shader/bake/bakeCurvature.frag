#include "hit.frag"

void	CurvatureIntersection( inout BakeHit h )
{
	h.output0.xyz = 0.5 * h.hitNormal + vec3(0.5,0.5,0.5);
}

#define Intersection	CurvatureIntersection
