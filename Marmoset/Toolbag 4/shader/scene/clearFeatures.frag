#include "data/shader/common/colorspace.sh"

USE_TEXTURE2D(tBackground);

BEGIN_PARAMS
	INPUT0(vec2, fCoord)
	OUTPUT_COLOR0(vec4)
	OUTPUT_COLOR1(vec4)
END_PARAMS
{
	//screen and NDC coordinates
	vec2 ndcCoord = fCoord;
	#ifdef RENDERTARGET_Y_DOWN
		vec2 screenCoord = vec2( 0.5,-0.5 ) * ndcCoord + vec2( 0.5, 0.5 );
	#else
		vec2 screenCoord = vec2( 0.5, 0.5 ) * ndcCoord + vec2( 0.5, 0.5 );
	#endif

	vec3 bgcolor = texture2D( tBackground, screenCoord ).rgb;
	vec3 albedo  = linearTosRGB( bgcolor );

	OUT_COLOR0 = vec4( albedo, 0.0 );
	OUT_COLOR1 = vec4( 0.0, 0.0, 0.0, 0.0 );
}
