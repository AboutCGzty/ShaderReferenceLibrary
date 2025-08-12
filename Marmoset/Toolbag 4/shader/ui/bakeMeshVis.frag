USE_TEXTURE2D(tOffsetMask2);

uniform vec4	uBrushMarker;	// { u, v, size, sharpness }
uniform vec3	uColor0, uColor1;
uniform float	uAlpha;
uniform int		uPaintMode;

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)
	INPUT1(vec3,fBrushCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	float offsetMask = texture2D( tOffsetMask2, fTexCoord ).x;
	OUT_COLOR0.rgb = mix( uColor0, uColor1, sqrt(offsetMask) );
	OUT_COLOR0.a = IN_FRONTFACING ? uAlpha : 0.2*uAlpha;
	OUT_COLOR0.rgb *= OUT_COLOR0.a;

	float feather = 0.0;
	if( uPaintMode == 1 )
	{
		//3d brush painting
		feather = 1.0 - saturate(length(fBrushCoord));
	}
	else if( uPaintMode == 0 )
	{
		//uv painting
		feather = 1.0 - min( length(frac(fTexCoord)-uBrushMarker.xy)/uBrushMarker.z, 1.0 );
	}

	feather = pow( feather, (2.0+1.0e-6) - 2.0*uBrushMarker.w );
	OUT_COLOR0 = mix( OUT_COLOR0, vec4( 0.2, 0.2, 0.4, 0.4 ), feather );
}