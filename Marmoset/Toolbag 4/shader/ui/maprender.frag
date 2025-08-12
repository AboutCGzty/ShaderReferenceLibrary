USE_TEXTURE2D(tMap);

uniform vec4	uTexCoordScaleBias;

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0 = texture2D( tMap, fTexCoord * uTexCoordScaleBias.xy + uTexCoordScaleBias.zw );
}