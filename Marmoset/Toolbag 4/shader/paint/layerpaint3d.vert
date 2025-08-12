#include "commonPaint.sh"
#include "../common/util.sh"

uniform mat4 	uNormalMatrix;
uniform mat4	uModelMatrix;
uniform mat4	uModelBrushMatrix[SPLOT_COUNT];
uniform mat4	uPostTransform[SPLOT_COUNT];	//paintspace transform for shaping the splot
uniform float	uFlip;
uniform vec2	uUVShift;		//for drawing UVs that reside outside of the 0-1 range
uniform float	uAspect;			//aspect of the texture we're painting to
#ifdef USE_OVERLAY
uniform float	uOutput3D;
#endif
uniform mat4	uViewProjectionMatrix;
uniform float	uFake2D;	//used for UV painting preview in 3D space

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
#define SPLOT_TYPE vec4
	OUTPUT3(SPLOT_TYPE, fBrushCoord0)
	
//overlay only has one splot and doesn't have the tex coord
#ifdef USE_OVERLAY
	OUTPUT4(vec2, fTexCoord)
#endif

#if(SPLOT_COUNT > 1)
	OUTPUT4(SPLOT_TYPE, fBrushCoord1)
#endif

#if(SPLOT_COUNT > 2)
	OUTPUT5(SPLOT_TYPE, fBrushCoord2)
#endif
#if(SPLOT_COUNT > 3)
	OUTPUT6(SPLOT_TYPE, fBrushCoord3)
#endif
#if(SPLOT_COUNT > 4)
	OUTPUT7(SPLOT_TYPE, fBrushCoord4)
#endif
#if(SPLOT_COUNT > 5)
	OUTPUT8(SPLOT_TYPE, fBrushCoord5)
#endif
#if(SPLOT_COUNT > 6)
	OUTPUT9(SPLOT_TYPE, fBrushCoord6)
#endif
#if(SPLOT_COUNT > 7)
	OUTPUT10(SPLOT_TYPE, fBrushCoord7)
#endif
#if(SPLOT_COUNT > 8)
	OUTPUT11(SPLOT_TYPE, fBrushCoord8)
#endif
#if(SPLOT_COUNT > 9)
	OUTPUT12(SPLOT_TYPE, fBrushCoord9)
#endif
#if(SPLOT_COUNT > 10)
	OUTPUT13(SPLOT_TYPE, fBrushCoord10)
#endif
#if(SPLOT_COUNT > 11)
	OUTPUT14(SPLOT_TYPE, fBrushCoord11)
#endif
#if(SPLOT_COUNT > 12)
	OUTPUT15(SPLOT_TYPE, fBrushCoord12)
#endif
#if(SPLOT_COUNT > 13)
	OUTPUT16(SPLOT_TYPE, fBrushCoord13)
#endif
#if(SPLOT_COUNT > 14)
	OUTPUT17(SPLOT_TYPE, fBrushCoord14)
#endif
#if(SPLOT_COUNT > 15)
	OUTPUT18(SPLOT_TYPE, fBrushCoord15)
#endif

END_PARAMS
{
	
	#define doSplot(n) \
	brushSpace.xyz = vertexPos;\
	brushSpace = mulPoint( uModelBrushMatrix[n], brushSpace.xyz ); \
	brushSpace.xyz = mulPoint(uPostTransform[n], brushSpace.xyz/brushSpace.w).xyz*brushSpace.w;\
	fBrushCoord##n = brushSpace;\
	fBrushCoord##n.z = mix(fBrushCoord##n.z, 0.5, uFake2D);	//flatten Z in UV painting
	
	//paint-space position is vertex pos when 3D painting, or tex coord when emulating 2D painting
	vec3 vertexPos = mix(mulPoint(uModelMatrix, vPosition).xyz, vec3(vTexCoord0.xy - uUVShift, 0.0), uFake2D).xyz;
	vec4 brushSpace;

	#define splotThing(n) doSplot(n)
	DO_ALL_SPLOTS

	fNormal = mulVec(uNormalMatrix, vNormal * 2.0 - 1.0);
	fTangent = mulVec(uModelMatrix, vTangent * 2.0 - 1.0);
	fBitangent = mulVec(uModelMatrix, vBitangent * 2.0 - 1.0);
	
#if(TEST_NORMAL==FACE)	//with face normals, send the vertex position through the tangent pipe
	fTangent = mulPoint(uModelMatrix, vPosition).xyz; 
#endif

	//output can be in 3D space for viewport preview, or 2D texturespace space for UV preview or actual painting
	vec4 texSpace = vec4(2.0*(vTexCoord0.xy - uUVShift) - vec2(1.0,1.0), 0.0, 1.0);
	texSpace.xyz = mulPoint(uViewProjectionMatrix, texSpace.xyz).xyz;
	texSpace.y *= uFlip;
#ifdef USE_OVERLAY
	texSpace.y *= -1.0;	//opposite flipness for overlay
#endif


#ifdef USE_OVERLAY
	vec4 pos = mulPoint( uViewProjectionMatrix, mulPoint( uModelMatrix, vPosition ).xyz );	
	fTexCoord = vTexCoord0.xy; 
	OUT_POSITION = mix(texSpace, pos, float(uOutput3D));
#else
	OUT_POSITION = texSpace;
#endif
}
