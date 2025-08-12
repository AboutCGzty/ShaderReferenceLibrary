#include "../common/util.sh"

uniform mat4	uModelMatrix;
uniform mat4	uViewProjectionMatrix;
uniform mat4	uModelBrushMatrix;

BEGIN_PARAMS
	INPUT_VERTEXID(vID)
	OUTPUT0(vec2,fTexCoord)
END_PARAMS
{
	fTexCoord = vec2(	(vID > 1 && vID != 5) ? 1.0 : 0.0,
					(vID == 0 || vID > 3) ? 1.0 : 0.0	);
	vec2 vert = fTexCoord - 0.5;
	
	//0.9 because that's the scale at which splot preview is drawn
	vec3 p = mulPoint( uModelMatrix, vec3(vert / 0.9, 0.0) ).xyz;
	
//	fBrushCoord = mulPoint( uModelBrushMatrix, fCoord ).xyz;

	OUT_POSITION = mulPoint( uViewProjectionMatrix, p );
}
