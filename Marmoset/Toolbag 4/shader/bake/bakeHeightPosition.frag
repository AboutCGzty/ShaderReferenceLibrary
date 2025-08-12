#include "hit.frag"
#include "dither.frag"

uniform vec2	uHeightScaleBias;
uniform float	uDitherScaleHeight;
uniform float	uDitherScalePosition;

uniform vec3	uPositionMin, uPositionMax;
uniform int		uNormalizationMode;

#define BAKE_OUTPUTS	2

void	HeightPosition( inout BakeHit h )
{
	//output0: height
	float height = h.rayLength;
	height -= length( h.dstPosition - h.rayOrigin );
	height = height * uHeightScaleBias.x + uHeightScaleBias.y;
	if( uDitherScaleHeight > 0.0 )
	{ height = dither8bit( vec3( height, height, height ), floor( vec2( h.dstPixelCoord.xy ) * uDitherScaleHeight ) ).x; }
	h.output0 = vec4( height, height, height, 1.0 );
	
	//output1: position gradient
	vec3 p = h.hitPosition;
	vec3 boxDimensions = uPositionMax - uPositionMin;

	if( uNormalizationMode == 0 )
	{
		p -= uPositionMin;
		p /= boxDimensions;
	}
	else if( uNormalizationMode == 1 )
	{
		float boxMaxDimension = max( boxDimensions.x, max( boxDimensions.y, boxDimensions.z ) );
		vec3 stretch = boxDimensions / boxMaxDimension;
		vec3 stretchBounds = ( 1.0 - stretch ) / 2.0;

		p -= uPositionMin;
		p /= boxDimensions;

		p *= stretch;
		p += stretchBounds;
	}
	
	if( uDitherScalePosition > 0.0 )
	{ p = dither8bit( p, floor( vec2( h.dstPixelCoord.xy ) * uDitherScalePosition) ); }
	h.output1.rgb = p;
}

#define Intersection HeightPosition