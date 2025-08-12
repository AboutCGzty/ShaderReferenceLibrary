#include "../../common/util.sh"

uniform float	uFlip;

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)

	OUTPUT0(vec2, fVPPos)		//viewport position
END_PARAMS
{

	vec2 vertexPos = vTexCoord0.xy;
	fVPPos = vertexPos.xy;
	
	vec4 texSpace = vec4(2.0*(vTexCoord0.xy) - vec2(1.0,1.0), 0.5, 1.0);
	texSpace.y *= uFlip;
	OUT_POSITION = texSpace;
//	OUT_POSITION = fVPPos;
}
