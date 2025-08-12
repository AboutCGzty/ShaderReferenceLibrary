#include "hit.frag"

//we want to modify the ray data for successive passes
#define REWRITE_RAY_DATA

uniform float	uHemisphereOffset;

void	AOIntersection( inout BakeHit h )
{
	//determine AO hemisphere location & orientation
	vec3 dir = normalize( h.hitNormal );
	vec3 pos = h.hitPosition + dir * uHemisphereOffset;
	h.rayDirection = dir;
	h.rayOrigin = pos;
}

#define Intersection	AOIntersection
