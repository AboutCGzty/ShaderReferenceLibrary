#ifndef MSET_MOTION_SH
#define MSET_MOTION_SH

uniform mat4	uMotionShadingToRaster;
uniform mat4	uMotionShadingToRasterPrev;
uniform vec4	uMotionJitter; //{current, prev}

vec2	computeMotionNDC( vec3 position )
{
	vec4 rasterPosition = mulPoint( uMotionShadingToRaster, position );
	vec2 ndcPosition = ( rasterPosition.xy / rasterPosition.w ) - uMotionJitter.xy;
	ndcPosition = ndcPosition * vec2( 0.5, -0.5 ) + vec2( 0.5, 0.5 );
	
	vec4 rasterPositionPrev = mulPoint( uMotionShadingToRasterPrev, position );
	vec2 ndcPositionPrev = ( rasterPositionPrev.xy / rasterPositionPrev.w ) - uMotionJitter.zw;
	ndcPositionPrev = ndcPositionPrev * vec2( 0.5, -0.5 ) + vec2( 0.5, 0.5 );

	return ndcPosition - ndcPositionPrev;
}

#endif