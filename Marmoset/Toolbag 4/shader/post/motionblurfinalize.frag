USE_TEXTURE2D_NOSAMPLER(tAccumulationBuffer);

BEGIN_PARAMS
    INPUT0(vec2,Texture)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0 = imageLoad(tAccumulationBuffer, uint2(IN_POSITION.xy));
}
