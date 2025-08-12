uniform vec4	uScaleBias;

BEGIN_PARAMS
	INPUT0(vec3,aPosition)
	OUTPUT0(vec3,vPosition)
END_PARAMS
{
	OUT_POSITION.xy = uScaleBias.xy * aPosition.xy + uScaleBias.zw;
	OUT_POSITION.zw = vec2( 0.0, 1.0 );

	vPosition = aPosition;
}