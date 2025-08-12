uniform vec4 uBlitRect;

BEGIN_PARAMS
	INPUT_VERTEXID(vID)

	OUTPUT0(vec2,fCoord)
END_PARAMS
{
	vec2 coord = vec2(
		(vID < 2 || vID > 4) ? 0.0 : 1.0,
		(vID < 1 || vID > 3) ? 1.0 : 0.0
	);
	fCoord = coord;
	#ifdef RENDERTARGET_Y_DOWN
		fCoord.y = 1.0 - fCoord.y;
	#endif

	OUT_POSITION.xy = 2.0 * (uBlitRect.xy + uBlitRect.zw * coord) - vec2(1.0,1.0);
	OUT_POSITION.zw = vec2( 0.9999, 1.0 );
}