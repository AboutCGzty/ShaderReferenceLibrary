#include "../../common/util.sh"

uniform mat4 	uNormalMatrix;
uniform mat4	uModelMatrix;
uniform float	uFlip;
uniform mat4	uViewProjectionMatrix;
uniform mat4	uViewMatrix;

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)

	OUTPUT0(vec4, fVPPos)		//viewport position
	OUTPUT1(vec3, fNormal)
	OUTPUT2(float, fZ)
	OUTPUT3(vec3, fRelPos)
END_PARAMS
{

	vec3 vertexPos = mulPoint(uModelMatrix, vPosition).xyz;
	fZ = mulPoint(uViewMatrix, vertexPos).z;
	fRelPos = mulPoint(uViewMatrix, vertexPos).xyz;
	fVPPos = mulPoint(uViewProjectionMatrix, vertexPos);
	fNormal = (mulVec(uNormalMatrix, vNormal * 2.0 - 1.0));
	fNormal = normalize(mulVec(uViewMatrix, fNormal));
	vec4 texSpace = vec4(2.0*(vTexCoord0.xy) - vec2(1.0,1.0), 0.0, 1.0);
	texSpace.y *= uFlip;
	OUT_POSITION = texSpace;
//	OUT_POSITION = fVPPos;
}
