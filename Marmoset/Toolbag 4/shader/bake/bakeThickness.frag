#include "hit.frag"

//we want to modify the ray data for successive passes
#define REWRITE_RAY_DATA

uniform float	uHemisphereOffset;

void	ThiccIntersection( inout BakeHit h )
{
	//determine hemisphere location & orientation
	vec3 dir = -normalize( h.hitNormal );
	vec3 pos = h.hitPosition + dir * uHemisphereOffset;
	h.rayDirection = dir;
	h.rayOrigin = pos;
}

#define Intersection	ThiccIntersection