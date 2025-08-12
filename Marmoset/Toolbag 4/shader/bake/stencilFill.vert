#include "../common/util.sh"

uniform vec4	uScaleBias;

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)
	INPUT7(vec3,vBakeDir)
END_PARAMS
{
	OUT_POSITION.xy = uScaleBias.xy*vTexCoord0 + uScaleBias.zw;
	OUT_POSITION.zw = vec2( 0.5, 1.0 );
}
