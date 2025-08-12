#include "hit.frag"
#include "dither.frag"

uniform float	uDither;

void	AOPostIntersection( inout BakePostHit h )
{
	vec3 ao = h.hitData.xxx;

	if( uDither > 0.0 )
	{
		ao = dither8bit( ao, floor( vec2( h.dstPixelCoord ) * uDither ) );
	}

	h.output0.xyz = ao;
}

#define PostIntersection AOPostIntersection