#include "buffers.comp"

USE_BUFFER(uint2,bRadiance);

uniform uint  uRadianceStride;
uniform float uRadianceSampleWeight;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	uint2 outputCoord	= uint2( IN_POSITION.xy );
	uint  radianceIndex	= outputCoord.y * uRadianceStride + outputCoord.x;

	vec4 radiance = unpackVec4f( bRadiance[radianceIndex] );
#ifdef RT_SANITIZE_RADIANCE
	radiance = max( radiance, vec4(0.0, 0.0, 0.0, 0.0) );
#endif
	OUT_COLOR0 = radiance * uRadianceSampleWeight;
}
