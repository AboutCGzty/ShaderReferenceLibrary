uniform vec4 uViewportScaleBias;

BEGIN_PARAMS
INPUT_VERTEXID(vertID)
OUTPUT0(vec2, fBufferCoord)
END_PARAMS
{
	vec4 scaleBias = uViewportScaleBias;

	//flip raster position so that all rendered results are upside down
	#ifdef RENDERTARGET_Y_DOWN
		vec2 pos = vec2(
			vertID == 2 ? 3.0 : -1.0,
			vertID == 1 ? -3.0 : 1.0 );
		scaleBias.w = -scaleBias.w;		
	#else
		vec2 pos = vec2(
			vertID == 1 ? 3.0 : -1.0,
			vertID == 2 ? 3.0 : -1.0 );
	#endif

	fBufferCoord.xy = abs(pos) - vec2(1.0, 1.0);
	OUT_POSITION.xy = (pos*scaleBias.xy) + scaleBias.zw;
	OUT_POSITION.zw = vec2( 0.5, 1.0 );
}

