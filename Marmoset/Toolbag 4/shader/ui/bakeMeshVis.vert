#include "../common/util.sh"

USE_TEXTURE2D(tOffsetMask);
uniform vec2	uBakeOffset;
uniform mat4	uModelMatrix;
uniform mat4	uModelMatrixInvTrans;
uniform mat4	uViewProjectionMatrix;
uniform mat4	uModelBrushMatrix;

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
	INPUT7(vec3,vBakeDir)

	OUTPUT0(vec2,fTexCoord)
	OUTPUT1(vec3,fBrushCoord)
END_PARAMS
{
	float offsetMask = texture2DLod( tOffsetMask, vTexCoord0, 0.0 ).x;
	float offset = mix( uBakeOffset.x, uBakeOffset.y, offsetMask );

	vec3 bakeDir = normalize( mulVec( uModelMatrixInvTrans, decodeUnitVector( vBakeDir ) ) );
	vec3 p = mulPoint( uModelMatrix, vPosition ).xyz + bakeDir * offset;
	
	fBrushCoord = mulPoint( uModelBrushMatrix, vPosition ).xyz;

	OUT_POSITION = mulPoint( uViewProjectionMatrix, p );
	fTexCoord = vTexCoord0;
}