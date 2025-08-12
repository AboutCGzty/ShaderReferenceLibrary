#define USE_FALLOFF
#include "commonPaint.sh"

///////////////////////////
//grayscale map for all pixels as compared against sample at "uReferenceUV" from "tTextureOriginalSrc""

USE_TEXTURE2D( tTextureOriginalSrc );
USE_TEXTURE2D( tTSNormalMap );

USE_TEXTURE2D( tTextureSelectionMask );

uniform vec2		uReferenceUV;
uniform int			uFlipVertical;

uniform int			uCullSamples;
uniform int			uCullNormalMap;

uniform float 		uMaxAngle;
uniform float		uFalloffAmount;
uniform vec3		uRefNormal; 


float calcFalloff(vec3 ref, vec3 test)
{
	float dotProduct = dot(ref, test);
	return angleFalloff(dotProduct, uMaxAngle, uFalloffAmount);
}


BEGIN_PARAMS
	INPUT0(vec2, fCoord)
	INPUT1( vec3, fPosition )
	INPUT3( vec3, fNormal )
	INPUT4( vec3, fTangent )
	INPUT5( vec3, fBitangent )	

	OUTPUT_COLOR0(float)
END_PARAMS
{
	if( uFlipVertical != 0 )
	{ fCoord.y = 1.0f - fCoord.y; }
	vec4 referenceColor = texture2DLod( tTextureOriginalSrc, uReferenceUV, 0.0 );
	vec4 sampleColor = texture2DLod( tTextureOriginalSrc, fCoord, 0.0 );

	float xdiff = sampleColor.x-referenceColor.x;
	float ydiff = sampleColor.y-referenceColor.y;
	float zdiff = sampleColor.z-referenceColor.z;
	if( xdiff < 0 ) xdiff = -xdiff;
	if( ydiff < 0 ) ydiff = -ydiff;
	if( zdiff < 0 ) zdiff = -zdiff;
	float rgblen = sqrt((xdiff*xdiff)+(ydiff*ydiff)+(zdiff*zdiff));
	float percentDiff = rgblen / 1.73205080757;
	float match = 1.0f - percentDiff;
	if( sampleColor.w == 0 && referenceColor.w == 0 )
	{ match = 1; }
	float value = 0;
	if( match > 0 )
	{
		value = match;

		if( uCullSamples != 0 )
		{
			//cull here
			float l;
			vec3 normHere = fNormal;
			vec2 texCoord = fCoord;
			if( uCullNormalMap )
			{
				CALC_WS_NORMAL;
			}
			vec3 refNormal = uRefNormal;
			float falloff = calcFalloff(refNormal, normHere);
			value *= falloff;
		}
	}
	vec4 selectionMask = texture2DLod( tTextureSelectionMask, fCoord, 0.0 );
	value *= selectionMask.x;

	OUT_COLOR0.x = value;

}
