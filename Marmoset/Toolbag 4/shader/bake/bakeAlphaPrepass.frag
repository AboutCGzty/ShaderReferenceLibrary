BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec3,fTangent)
	INPUT2(vec3,fBitangent)
	INPUT3(vec3,fNormal)
	INPUT4(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
	#if BAKE_OUTPUTS > 1
		OUTPUT_COLOR1(vec4)
	#endif
	#if BAKE_OUTPUTS > 2
		OUTPUT_COLOR2(vec4)
	#endif
	#if BAKE_OUTPUTS > 3
		OUTPUT_COLOR3(vec4)
	#endif
END_PARAMS
{
    OUT_COLOR0.rgb = vec3( 0.0, 0.0, 0.0 );
    OUT_COLOR0.a = 1.0;
}