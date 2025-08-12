#include "hit.frag"
#include "dither.frag"

uniform float	uRange; // 1/maxDist
uniform float	uDither;
uniform float	uCurve;

void	ThiccPostIntersection( inout BakePostHit h )
{
	float d = 1.0 - saturate( h.hitData.y * uRange );
	d = pow( d, uCurve );

	if( uRange <= 0.0 )
	{
		d = h.hitData.y;
	}

	if( uDither > 0.0 )
	{ d = dither8bit( vec3( d, d, d ), floor( vec2( h.dstPixelCoord ) * uDither ) ).x; }
	
	h.output0.xyz = vec3( d, d, d );
}

#define PostIntersection ThiccPostIntersection
