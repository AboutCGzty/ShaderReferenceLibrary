#include "../common/util.sh"

uniform mat4	uModelMatrixInvTrans;

vec3	decodeUnitVector( vec3 v )
{
	return (2.0*(1023.0/1022.0))*v - vec3(1.0,1.0,1.0);
}

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)

	OUTPUT1(vec2,fTexCoord)
	OUTPUT2(vec3,fTangent)
	OUTPUT3(vec3,fBitangent)
	OUTPUT4(vec3,fNormal)
END_PARAMS
{
	OUT_POSITION.xy = 2.0*vTexCoord0 - vec2(1.0,1.0);
	OUT_POSITION.zw = vec2( 0.5, 1.0 );
	
	fTexCoord = vTexCoord0;

	fTangent = mulVec( uModelMatrixInvTrans, decodeUnitVector( vTangent ) );
	fBitangent = mulVec( uModelMatrixInvTrans, decodeUnitVector( vBitangent ) );
	fNormal = mulVec( uModelMatrixInvTrans, decodeUnitVector( vNormal ) );
}
