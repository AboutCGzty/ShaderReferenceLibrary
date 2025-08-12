USE_TEXTURE2D(tInput);

uniform float	uBrightness;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0.xyz = uBrightness * texture2DLod( tInput, fCoord, 0.0 ).rgb;
	OUT_COLOR0.w = 0.0;
}