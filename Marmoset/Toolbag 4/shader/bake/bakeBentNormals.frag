#include "hit.frag"
#include "matNormals.frag"

//we want to modify the ray data for successive passes
#define REWRITE_RAY_DATA

uniform float	uHemisphereOffset;

void	BentNormalIntersection( inout BakeHit h )
{
	vec3 n = sampleMaterialNormal( h.hitTexCoord, h.hitTangent, h.hitBitangent, h.hitNormal );

	vec3 dir = normalize( n );
	vec3 pos = h.hitPosition + dir * uHemisphereOffset;

	h.rayDirection = dir;
	h.rayOrigin = pos;
}

#define Intersection	BentNormalIntersection
