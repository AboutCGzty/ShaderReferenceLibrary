#include "../common/util.sh"

uniform mat4	uModelMatrix;
uniform mat4	uModelMatrixInvTrans;
uniform vec4	uIntersectionScaleBias;

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

	OUTPUT0(vec3,fPosition)
	OUTPUT1(vec3,fTangent)
	OUTPUT2(vec3,fBitangent)
	OUTPUT3(vec3,fNormal)
	OUTPUT4(vec2,fTexCoord)
END_PARAMS
{
	OUT_POSITION.xy = uIntersectionScaleBias.xy*vTexCoord0 + uIntersectionScaleBias.zw;
	OUT_POSITION.zw = vec2( 0.5, 1.0 );
	
	fPosition = mulPoint( uModelMatrix, vPosition ).xyz;

	fTangent = normalize( mulVec( uModelMatrixInvTrans, decodeUnitVector(vTangent) ) );
	fBitangent = normalize( mulVec( uModelMatrixInvTrans, decodeUnitVector(vBitangent) ) );
	fNormal = normalize( mulVec( uModelMatrixInvTrans, decodeUnitVector(vNormal) ) );
	fTexCoord = vTexCoord0;
}
