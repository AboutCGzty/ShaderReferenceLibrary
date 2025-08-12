USE_TEXTURE2D(tTex);

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0 = texture2D(tTex, fCoord);
//	OUT_COLOR0.rg = fCoord;
//	OUT_COLOR0.a = 1.0;
}
