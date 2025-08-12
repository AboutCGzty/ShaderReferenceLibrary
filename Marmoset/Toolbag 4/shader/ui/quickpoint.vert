#include "../common/util.sh"

uniform mat4	uModelMatrix;
uniform mat4	uViewProjectionMatrix;
uniform ivec4   uViewRect;
uniform float	uPointSize;
uniform vec3	uP;
uniform vec4	uColor;
uniform int 	uBufferHeight;

//raster space transform
uniform mat4	uRasterTransform;

#include "quickdrawshared.sh"

BEGIN_PARAMS
	INPUT_VERTEXID(vID)
	OUTPUT0(vec4,fColor)

END_PARAMS

{
	vec4 p = mulPoint(uViewProjectionMatrix, mulPoint(uModelMatrix, uP).xyz);
	p = applyRasterOffset(p);
	
	vec2 coord = vec2(	(vID > 1 && vID != 5) ? 1.0 : -1.0,
		(vID == 0 || vID > 3) ? 1.0 : -1.0	);
	float t = coord.x;
	
	
	float weightX = uPointSize / float(uViewRect.z) * p.w;
	float weightY = uPointSize / float(uViewRect.w) * p.w;
	
	vec2 corner = vec2(weightX, weightY)* coord * 1.0;
	fColor = uColor;
	OUT_POSITION = p;
	OUT_POSITION.xy += corner;


}	
