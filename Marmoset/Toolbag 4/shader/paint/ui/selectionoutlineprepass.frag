#include "../commonPaint.sh"
#include "../../common/util.sh"

USE_TEXTURE2D(tSelection);

BEGIN_PARAMS
	INPUT0(vec2, fTexCoord)
	OUTPUT_COLOR0(vec4)
END_PARAMS

{

	float selectionMask = texture2D(tSelection, fTexCoord).r;
	vec4 overlayColor = vec4(0.0, 0.0, 0.0, 0.0);

	OUT_COLOR0 = vec4(0.05, 1.0, 0.0, 1.0);
	OUT_COLOR0 = mix(OUT_COLOR0, vec4(1, 0, 0, 1), 1.0-step(selectionMask, 0.5));
	
	
	

}
