#include "commonPaint.sh"
#include "../common/util.sh"

uniform mat4 	uNormalMatrix;
uniform mat4	uModelMatrix;
uniform float	uFlip;
#ifdef USE_OVERLAY
uniform float	uOutput3D;
#endif
uniform mat4	uViewProjectionMatrix;

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)


	OUTPUT0(vec3, fNormal)
	OUTPUT1(vec3, fTangent)
	OUTPUT2(vec3, fBitangent)
	OUTPUT3(vec2, fTexCoord)
	

END_PARAMS
{
	
	
	//paint-space position is vertex pos when 3D painting, or tex coord when emulating 2D painting
	vec3 vertexPos = mulPoint(uModelMatrix, vPosition).xyz;
	fNormal = mulVec(uNormalMatrix, vNormal * 2.0 - 1.0);
	fTangent = mulVec(uModelMatrix, vTangent * 2.0 - 1.0);
	fBitangent = mulVec(uModelMatrix, vBitangent * 2.0 - 1.0);

	vec4 pos = mulPoint( uViewProjectionMatrix, mulPoint( uModelMatrix, vPosition ).xyz );	
	fTexCoord = vTexCoord0.xy; 
	OUT_POSITION = pos;
}
