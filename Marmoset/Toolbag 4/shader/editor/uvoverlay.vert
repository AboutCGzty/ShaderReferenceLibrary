uniform vec4	uScaleBias;
uniform vec4	uWireframeColor;
BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)

	OUTPUT0(vec4,fColor)
END_PARAMS
{
	vec2 tc = uScaleBias.xy * vTexCoord0 + uScaleBias.zw;
	OUT_POSITION.xy = 2.0*tc - vec2(1.0,1.0);
	OUT_POSITION.zw = vec2( 0.5, 1.0 );

	fColor = uWireframeColor;
}
