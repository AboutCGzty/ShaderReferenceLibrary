USE_TEXTURE2D(tDepth);
uniform vec2 uPixelSize;
uniform vec4 uOutlineColor;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)
	
	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	//screen and NDC coordinates
	vec2 ndcCoord = fCoord;
	#ifdef RENDERTARGET_Y_DOWN
		vec2 screenCoord = vec2( 0.5,-0.5 ) * ndcCoord + vec2( 0.5, 0.5 );
	#else
		vec2 screenCoord = vec2( 0.5, 0.5 ) * ndcCoord + vec2( 0.5, 0.5 );
	#endif

	float depth = texture2DLod( tDepth, screenCoord, 0.0 ).x;

    if( depth == 0.0 )
    { discard; }

    depth = 1.0;
    float difference = 0.0;

    for(int xx = -2; xx < 3; ++xx)
    {
        for(int yy = -2; yy < 3; ++yy)
        {
            float curDepth = texture2DLod( tDepth, screenCoord + uPixelSize * vec2(float(xx), float(yy)), 0.0).x;
            float dif = curDepth - depth;
            difference += abs( dif );
        }
    }

    if( difference <= 0.0 )
    { discard; }

	OUT_COLOR0 = uOutlineColor;
}