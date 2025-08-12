USE_TEXTURE2D_NOSAMPLER(tRadiance);

BEGIN_PARAMS
	INPUT0(vec2,fCoord)
	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	uint2 outputCoord = uint2( IN_POSITION.xy );
	OUT_COLOR0 = imageLoad( tRadiance, outputCoord );
}
