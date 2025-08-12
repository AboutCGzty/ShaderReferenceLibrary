USE_TEXTURE2D(tMap);

uniform int uMode;
uniform vec4 uChannelMask;
uniform vec2 uTexCoordScaleBias;

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
    vec4 outColor = texture2D( tMap, uTexCoordScaleBias * fTexCoord );

    if( uMode == 1 )
    {
        float singleChannel = dot( outColor, uChannelMask );
        outColor = vec4( singleChannel, singleChannel, singleChannel, 1.0 );
    }

	OUT_COLOR0 = outColor;
}