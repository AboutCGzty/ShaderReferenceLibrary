#include "hit.frag"

#ifndef BAKE_OUTPUTS
	#define BAKE_OUTPUTS 1
#endif

USE_TEXTURE2D(tIndex);
USE_BUFFER(vec4,bRays);
USE_BUFFER(vec4,bHits);

BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec3,fTangent)
	INPUT2(vec3,fBitangent)
	INPUT3(vec3,fNormal)
	INPUT4(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
	#if BAKE_OUTPUTS > 1
		OUTPUT_COLOR1(vec4)
	#endif
	#if BAKE_OUTPUTS > 2
		OUTPUT_COLOR2(vec4)
	#endif
	#if BAKE_OUTPUTS > 3
		OUTPUT_COLOR3(vec4)
	#endif
END_PARAMS
{
	BakePostHit h;
	h.output0 =
	h.output1 =
	h.output2 =
	h.output3 = vec4(0.0, 0.0, 0.0, 1.0);

	uint rayIndex = asuint( imageLoad( tIndex, uint2( IN_POSITION.xy ) ).x );
	h.rayData = bRays[rayIndex];
	h.hitData = bHits[rayIndex];
	
	h.dstPosition = fPosition;
	h.dstPixelCoord = uint2(IN_POSITION.xy);
	h.dstTexCoord = fTexCoord;
	h.dstTangent = fTangent;
	h.dstBitangent = fBitangent;
	h.dstNormal = fNormal;

	bool valid = (asuint(h.hitData.x) != 0x7FFFFFFF); //NaN
	HINT_BRANCH if( valid )
	{
	#ifdef PostIntersection
		PostIntersection( h );
	#endif
	}
	else
	{ discard; }

	OUT_COLOR0 = h.output0;

	#if BAKE_OUTPUTS > 1
		OUT_COLOR1 = h.output1;
	#endif

	#if BAKE_OUTPUTS > 2
		OUT_COLOR2 = h.output2;
	#endif

	#if BAKE_OUTPUTS > 3
		OUT_COLOR3 = h.output3;
	#endif
}
