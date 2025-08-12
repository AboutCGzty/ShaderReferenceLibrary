#include "layerformat.sh"

uniform vec2 uTexCoordOffset;

#ifdef USE_SOLID_COLOR
	uniform vec4 uColor;
#else
	USE_TEXTURE2D(tTexture);
#endif

#ifdef USE_CLIPMASK
	USE_TEXTURE2D(tMask);
#endif

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 tc = fBufferCoord;

	#ifdef USE_CLIPMASK		
		if( texture2D( tMask, tc ).r < 0.001 ) discard;
	#endif

	tc += uTexCoordOffset;

#ifdef USE_SOLID_COLOR
	vec4 color = uColor;
#else
	vec4 color = texture2D( tTexture, tc );
#endif

	color = formatInputColor( uInputFormat, color );
	color = formatOutputColor( uOutputFormat, color );	
	OUT_COLOR0 = color;
}

