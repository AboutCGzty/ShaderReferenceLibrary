USE_TEXTURE2D(tMap);
USE_TEXTURE2D(tBackground);

uniform int	uChannelCount;
uniform vec4	uChannelMask;
uniform vec2	uMapSize;
uniform float	uLinearPreviewGamma;
uniform vec4	uTexCoordScaleBias;

vec3 sRGBToLinear( vec3 srgb )
{
	vec3 black = srgb * 0.0773993808;	
	vec3 lin = (srgb + vec3(0.055,0.055,0.055)) * 0.947867299;
	lin = pow( lin, 2.4 );

	lin.r = srgb.r <= 0.04045 ? black.r : lin.r;
	lin.g = srgb.g <= 0.04045 ? black.g : lin.g;
	lin.b = srgb.b <= 0.04045 ? black.b : lin.b;
	
	return lin;
}

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec4 back = texture2D( tBackground, fTexCoord * ( ( 1.0 / 16.0 ) * uMapSize ) );
	vec2 texCoord = fTexCoord * uTexCoordScaleBias.xy + uTexCoordScaleBias.zw;
	vec4 top = texture2D( tMap, texCoord );
	vec4 outColor = vec4( 0.0, 0.0, 0.0, 1.0 );

	if( uChannelCount == 1 )
	{
		float col = dot( top, uChannelMask );
		top = vec4( col, col, col, 1.0f );
	}
	if( uChannelCount == 2 )
	{
		top = vec4( top.r, top.r, top.r, top.g );
	}

	//alpha blend
	outColor.rgb = mix( back.rgb, top.rgb, top.a );
	outColor.rgb = mix( outColor.rgb, sRGBToLinear(outColor.rgb), uLinearPreviewGamma );
	OUT_COLOR0 = outColor;
}