#include "../common/util.sh"

uniform mat4	uModelMatrix;
uniform mat4	uViewProjectionMatrix;
uniform ivec4   uViewRect;
uniform vec3	uP1;
uniform vec3	uP2;
uniform vec3	uP3;
uniform vec4	uColor1;
uniform vec4	uColor2;
uniform vec4	uColor3;
uniform int 	uBufferHeight;

uniform vec2	uTex1;
uniform vec2	uTex2;
uniform vec2	uTex3;

//raster space transform
uniform mat4	uRasterTransform;

#include "quickdrawshared.sh"
 
BEGIN_PARAMS
	INPUT_VERTEXID(vID)
	OUTPUT0(vec4,fColor)
	OUTPUT1(vec2, fTexCoord)
END_PARAMS
{
	vec3 p3 = uP1 * float(vID == 0) + uP2 * float(vID == 1) + uP3 * float(vID == 2);
	vec4 p = mulPoint(uViewProjectionMatrix, mulPoint(uModelMatrix, p3).xyz);
	p = applyRasterOffset(p);
	fColor = uColor1 * float(vID == 0) + uColor2 * float(vID == 1) + uColor3 * float(vID == 2);
	fTexCoord = uTex1 * float(vID == 0) + uTex2 * float(vID == 1) + uTex3 * float(vID == 2);
	OUT_POSITION = p;
}	
