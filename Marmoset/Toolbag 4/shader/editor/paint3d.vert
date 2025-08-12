#include "../common/util.sh"

uniform mat4	uModelBrushMatrix;
uniform float	uFlip;

BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)

	OUTPUT0(vec3,fBrushCoord)
END_PARAMS
{
	fBrushCoord = mulPoint( uModelBrushMatrix, vPosition ).xyz;
	OUT_POSITION.xy = 2.0*vTexCoord0 - vec2(1.0,1.0);
	OUT_POSITION.y *= uFlip;
	OUT_POSITION.zw = vec2( 0.5, 1.0 );
}