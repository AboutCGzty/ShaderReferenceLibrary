#include "../common/util.sh"

uniform mat4	uModelMatrix;
uniform mat4	uViewProjectionMatrix;
uniform ivec4   uViewRect;
uniform float	uLineWidth;
uniform vec3	uP1;
uniform vec3	uP2;
uniform vec4	uColor1;
uniform vec4	uColor2;
uniform int 	uBufferHeight;
//raster space transform
uniform mat4	uRasterTransform;

//for miters
uniform vec3 	uPrevDir;
uniform vec3	uNextDir;

#include "quickdrawshared.sh"

BEGIN_PARAMS
	INPUT_VERTEXID(vID)
	OUTPUT0(vec4,fColor)
	OUTPUT1(vec2, fP1)
	OUTPUT2(vec2, fP2)
	OUTPUT3(float, fWidth)
	OUTPUT4(vec2, fTexCoord)
END_PARAMS

{
	vec4 p1 = mulPoint(uViewProjectionMatrix, mulPoint(uModelMatrix, uP1).xyz);
	vec4 pPrev = mulPoint(uViewProjectionMatrix, mulPoint(uModelMatrix, uP1-uPrevDir).xyz);
	p1 = applyRasterOffset(p1);
	pPrev = applyRasterOffset(pPrev);
	 
	vec2 prevDir = p1.xy/p1.w-pPrev.xy / pPrev.w;	//screenspace
	prevDir /= max(length(prevDir), 0.001);
	vec4 p2 = mulPoint(uViewProjectionMatrix, mulPoint(uModelMatrix, uP2).xyz);
	vec4 pNext = mulPoint(uViewProjectionMatrix, mulPoint(uModelMatrix, uP2 + uNextDir).xyz);
	p2 = applyRasterOffset(p2);
	pNext = applyRasterOffset(pNext);
	vec2 nextDir = pNext.xy/pNext.w-p2.xy/p2.w;
	nextDir /= max(length(nextDir), 0.001);

	vec2 myDir = p2.xy/p2.w - p1.xy/p1.w;
	myDir /= max(length(myDir), 0.001);
	vec2 frontButt = nextDir-myDir;
	vec2 backButt = myDir-prevDir;
	
	vec2 coord = vec2(	(vID > 1 && vID != 5) ? 1.0 : 0.0,
		(fract(float(vID)/2) == 0.0) ? 1.0 : 0.0);
	float t = coord.x;
	fTexCoord = coord;
	float weightX = uLineWidth / float(uViewRect.z);
	float weightY = uLineWidth / float(uViewRect.w);
	float w = 3.0*(1.0-float(vID != 1 && vID != 3 && vID != 5) * 2.0);
	
	vec2 otherDir =  mix(prevDir, nextDir, t);
	
	vec4 p = mix(p1, p2, t);

	vec2 miterButt =  mix(backButt, frontButt, t);
	vec2 squareNorm = normalize(vec2(p2.y/p2.w-p1.y/p1.w, p1.x/p1.w-p2.x/p2.w));
	vec2 butt = squareNorm;

	if(abs(otherDir.x*myDir.y - otherDir.y*myDir.x) > 0.001 && dot(miterButt, miterButt) > 0.001)	//if the lines aren't parallel, do the miter
	{ 
		if(dot(miterButt, butt) < 0.0)		//make sure the butt faces the same direction
		{ miterButt *= -1.0; }
		
		butt = normalize(miterButt);
//		butt *= mix(1.0, -1.0, step(0.5, t)); 
	}
	vec2 norm = butt * p.w;
	vec2 perp = vec2(weightX*norm.x, weightY*norm.y)*w;
	fColor = mix(uColor1, uColor2, t);
//	if(vID >= 3)
//	fColor = mix(fColor, vec4(0, 1, 0, 0.2), 0.5);
	OUT_POSITION = p;
	OUT_POSITION.xy += perp;

	fP1 = toPixel(p1);
	fP2 = toPixel(p2);
	
	fWidth = uLineWidth * 1.0;
}	
