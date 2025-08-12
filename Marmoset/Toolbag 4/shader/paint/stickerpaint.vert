#include "../common/util.sh"
#include "CommonPaint.sh"

uniform mat4	uModelMatrix;
uniform mat4	uModelBrush;
uniform mat4	uNormalMatrix;
//sticker painting is basically 2D painting
uniform vec4	uVerts[3];
uniform vec4	uUVs[3];
uniform vec4	uModelUVs[3];
uniform vec4	uModelNorms[3];
uniform vec4	uModelTangents[3];
uniform vec4	uModelBitangents[3];
uniform float	uFlip;
uniform vec2	uUVShift;		//for drawing UVs that reside outside of the 0-1 range
uniform float	uAspect;			//aspect of the texture we're painting to
uniform float	uOutput3D;
uniform mat4	uViewProjectionMatrix;
uniform float	uFake2D;	//used for UV painting preview in 3D space

BEGIN_PARAMS
	INPUT_VERTEXID(vID)
	OUTPUT0(vec3, fNormal)
	OUTPUT1(vec3, fTangent)
	OUTPUT2(vec3, fBitangent)
    OUTPUT3(vec4,fBrushCoord0)
    //overlay only has one splot and doesn't have the tex coord
#ifdef USE_OVERLAY
	OUTPUT4(vec2, fTexCoord)
#endif

END_PARAMS
{
	
	fBrushCoord0 = mulPoint(uModelBrush, vec3(uUVs[vID].xy * 2.0 - 1.0, 0.0));
	fBrushCoord0.z = 0.5;
	fBrushCoord0.w = 1.0;
	
	 
	//output can be in 3D space for viewport preview, or 2D texturespace space for UV preview or actual painting
	vec4 texSpace = vec4(2.0*(uModelUVs[vID].xy - uUVShift) - vec2(1.0,1.0), 0.0, 1.0);
	texSpace.xyz = mulPoint(uViewProjectionMatrix, texSpace.xyz).xyz;
	texSpace.y *= uFlip;
	texSpace.z = 0.0;

	vec4 pos = mulPoint( uViewProjectionMatrix, uVerts[vID].xyz );
	fNormal = mulVec(uNormalMatrix, uModelNorms[vID].xyz).xyz;
	fTangent = mulVec(uModelMatrix, uModelTangents[vID].xyz).xyz;
	fBitangent = mulVec(uModelMatrix, uModelBitangents[vID].xyz).xyz;
#if(TEST_NORMAL==FACE)	//with face normals, send the vertex position through the tangent pipe
	fTangent = mulPoint(uModelMatrix, uVerts[vID].xyz).xyz; 
#endif

#ifdef USE_OVERLAY
	fTexCoord = uModelUVs[vID].xy - uUVShift;
	texSpace.y = - texSpace.y;
#endif
	OUT_POSITION = mix(texSpace, pos, float(uOutput3D));
}
