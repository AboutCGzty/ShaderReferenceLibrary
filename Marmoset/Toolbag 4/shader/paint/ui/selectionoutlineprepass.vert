#include "../commonPaint.sh"
#include "../../common/util.sh"

uniform mat4	uModelMatrix;
uniform float	uFlip;
uniform float	uOutput3D;
uniform mat4	uViewProjectionMatrix;

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)


	OUTPUT0(vec2, fTexCoord)

END_PARAMS
{	

	vec4 pos = mulPoint( uViewProjectionMatrix, mulPoint( uModelMatrix, vPosition ).xyz );	
	fTexCoord = vTexCoord0.xy; 
	OUT_POSITION = pos;
}
