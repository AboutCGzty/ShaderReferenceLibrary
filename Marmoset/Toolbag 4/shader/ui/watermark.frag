USE_TEXTURE2D(tImage);

uniform vec4	uColor;
uniform vec4	uColor2;

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec4 c = texture2D( tImage, fTexCoord );
	c.rgb = c.r * uColor.rgb + c.g * uColor2.rgb;
	c.a *= uColor.a;
	OUT_COLOR0 = c;
}