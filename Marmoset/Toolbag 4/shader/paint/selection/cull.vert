#include "../commonPaint.sh"
#include "../../common/util.sh"

uniform mat4 	uNormalMatrix;
uniform mat4	uModelMatrix;
uniform float	uFlip;
uniform vec2	uUVShift;		//for drawing UVs that reside outside of the 0-1 range

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)


	OUTPUT0(vec2, fCoord)
	OUTPUT1(vec3, fNormal)
	OUTPUT2(vec3, fTangent)
	OUTPUT3(vec3, fBitangent)

END_PARAMS
{
	//paint-space position is vertex pos when 3D painting, or tex coord when emulating 2D painting
	vec3 vertexPos = vec3(vTexCoord0.xy - uUVShift, 0.0);

	fNormal = mulVec(uNormalMatrix, vNormal * 2.0 - 1.0);
	fTangent = mulVec(uModelMatrix, vTangent * 2.0 - 1.0);
	fBitangent = mulVec(uModelMatrix, vBitangent * 2.0 - 1.0);
	fCoord = vTexCoord0.xy;

	//output can be in 3D space for viewport preview, or 2D texturespace space for UV preview or actual painting
	vec4 texSpace = vec4(2.0*(vTexCoord0.xy - uUVShift) - vec2(1.0,1.0), 0.0, 1.0);
	texSpace.y *= uFlip;

	OUT_POSITION = texSpace;

}
