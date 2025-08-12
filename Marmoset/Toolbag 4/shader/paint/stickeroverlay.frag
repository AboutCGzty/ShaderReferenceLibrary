#include "commonPaint.sh"
#include "../common/util.sh"

uniform int		uBrushFrameCount;
uniform vec4	uRefNorm;			//no falloff (full opacity) at this normal, not necessarily the same as the paint direction
uniform float 	uWarp;
uniform float	uHardness;
uniform int 	uBrushFrame;		//per-splot animation frame
uniform int 	uBrushSeed;		//per-splot noise

uniform float	uOverlayMode;
uniform vec4 	uOverlayColor;

uniform float 	uMaxAngle;
uniform float	uFalloffAmount; 
USE_TEXTURE2D(tTSNormalMap);


USE_TEXTURE2D(tBrushTex);
USE_TEXTURE2D(tStickerTex);
USE_TEXTURE2D(tPadTex);
USE_SAMPLER(SampLinear);
uniform int uPadding;
uniform float uTipContrast;
uniform int uUseTexture;


//ddr is the rate of change of radial distance,  in brush coords/pixel
float sampleBrush(vec2 texCoord, float hardness, unsigned int frame, float ddr)
{
	//feather the brush stroke
	if(uUseTexture == 0)
	{ return distanceToValue(length(texCoord), ddr, hardness); }
	
	float feather = distanceToValue(getVignette(texCoord, hardness), ddr, hardness);
	
	feather = mix(feather, 1.0, float(hardness == 1.0));  //texture with hardness 1.0 ignores all anti-aliasing
	unsigned int frameCount = max(uBrushFrameCount, 1);

	float sampleWidth = 1.0 / float(frameCount);
	float sampleStart = sampleWidth * float(frame%frameCount);
	
	vec4 allMyExes = texture2D(tBrushTex, vec2((texCoord.x * 0.5 + 0.5) * sampleWidth + sampleStart, texCoord.y * 0.5 + 0.5));
	float texValue = allMyExes.r * allMyExes.a;
	float contrastStart = 0.1;
	float contrastAmount = smoothstep(0.0, contrastStart, texValue);
	float contrastRange = 1.0 - contrastStart;
	texValue = mix(texValue, (texValue-0.5) * uTipContrast + 0.5, contrastAmount); //apply contrast
	feather *= saturate(texValue);

	return feather;
}

float calcFalloff(vec3 ref, vec3 test)
{
	float dotProduct = dot(ref, test);
	return angleFalloff(dotProduct, uMaxAngle, uFalloffAmount);
}

BEGIN_PARAMS
INPUT0(vec3, fNormal)
INPUT1(vec3, fTangent)
INPUT2(vec3, fBitangent)
INPUT3(vec2, fTexCoord)
OUTPUT_COLOR0(vec4)

END_PARAMS
{
	vec2 tc = fTexCoord;
	if(uPadding == 1)
	{ tc = textureWithSampler(tPadTex, SampLinear, tc).xy; }
	vec4 sticker = texture2D(tStickerTex, vec2(tc.x, 1.0-tc.y));
	vec2 brushCoord = sticker.xy * 2.0 - 1.0;
	vec4 dPx = dFdx(sticker);
	vec4 dPy = dFdy(sticker);
	
	//the blue channel of the texture signifies the actual splot area.  Discard pixels where we're at or over the blue border
	float inBlue = step(1.0 + abs(dPx.b) + abs(dPy.b), sticker.b);
	vec2 dP = dPx.xy + dPy.xy;
	float ddr = length(dP) * 0.707;
	brushCoord.xy = distortUV(brushCoord.xy, uWarp, uBrushSeed);
	
	float alpha = sampleBrush(brushCoord.xy, uHardness, uBrushFrame, ddr);
	float dtx = abs(dFdx(alpha));
	float dty = abs(dFdy(alpha));
	float fval = 0.0;
	float thresh = 0.1;
	float jiggle = 1.0;		//thicken the line a bit
	
	if((alpha-dtx*jiggle <= thresh && alpha+dtx*jiggle > thresh) || (alpha-dty*jiggle <= thresh && alpha+dty*jiggle > thresh))
	{ fval = 1.0; }
	
	if(alpha + fval < thresh)
	{ discard; }
	
	vec4 overlayColor = uOverlayColor;
	overlayColor.a += fval;
	overlayColor.a *= inBlue;

	OUT_COLOR0 = overlayColor;
	
}
