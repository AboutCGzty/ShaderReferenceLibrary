#include "commonPaint.sh"
#include "../common/util.sh"

uniform float	uNoiseSeed;
uniform ivec2	uTargetSize;		//for smoothing very small brush sizes
uniform int		uBrushFrameCount;
#ifdef OUTPUT_UVS
uniform int		uMaterialFrameCount;
uniform int 	uMaterialFrame;		//only one splot in this case
#endif
uniform vec4	uRefNorm[SPLOT_COUNT];			//no falloff (full opacity) at this normal, not necessarily the same as the paint direction
uniform float 	uOpacity[SPLOT_COUNT];
uniform float	uFlow[SPLOT_COUNT]; 
uniform float 	uWarp[SPLOT_COUNT];
uniform float	uHardness[SPLOT_COUNT];
uniform int 	uBrushFrame[SPLOT_COUNT];		//per-splot animation frame
uniform int 	uBrushSeed[SPLOT_COUNT];		//per-splot noise

uniform int		uStrokeSampling;			//are we undersampling the stoke for speed?
uniform float	uOverlayMode;
uniform vec4 	uOverlayColor;

#ifdef USE_FALLOFF
uniform float 	uMaxAngle;
uniform float	uFalloffAmount; 
USE_TEXTURE2D(tTSNormalMap);
#endif

#ifdef USE_COMPENSATION_MAP
uniform float	uUseLookup;
USE_TEXTURE2D(tUVLookup);		//for un-distorting the texture with indirection
#endif

#ifdef USE_TEXTURE
USE_TEXTURE2D(tBrushTex);
uniform float uTipContrast;
#endif


//ddr is the rate of change of radial distance,  in brush coords/pixel
float sampleBrush(vec2 texCoord, float hardness, unsigned int frame, float ddr)
{
	//feather the brush stroke
#ifndef USE_TEXTURE
	return distanceToValue(length(texCoord), ddr, hardness);
#else
	
#endif
	float feather = distanceToValue(getVignette(texCoord, hardness), ddr, hardness);

#ifdef USE_TEXTURE
	
	//this line commented out because with mipmaps enabled for brushes, we get some speckling on Mac at small sizes
	//(also it looks nicer without it)
//	feather = mix(feather, 1.0, float(hardness == 1.0));  //texture with hardness 1.0 ignores all anti-aliasing
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
#endif	
	return feather;
}
//padding around the stroke for the early out.  We need a bit more for true screenspace (not 100% sure why)
#ifdef USE_W
#define strokePadding 1.25
#else
#define strokePadding 1.2
#endif

#define warpPadding 1.0

vec2 addBrushAlpha(vec2 position, vec4 brushCoord, float hardness, int frame, int seed, float flow, float opacity, float warp, inout vec2 total)
{
	float bz = brushCoord.z;
#ifdef USE_W
	bz /= brushCoord.w;
	brushCoord /= brushCoord.w;
	brushCoord.z = 0.5;
#endif
	//this early out is nearly identical to the one prior to calling this function but is necessary
	//for the dFdx functions below to work properly.  Culling area must be slightly smaller than the earlier cull
	if( (1.0 - step(strokePadding * (1.0 + warp * warpPadding) * .99, max(abs(brushCoord.x), abs(brushCoord.y)))) == 0.0)
	{ return brushCoord.xy; }

	
	float minZ = 0.35;
	float maxZ = 0.75;
//	minZ = -1.0; 
//	maxZ = 1.0; 
#ifdef USE_COMPENSATION_MAP
	float inRect = (1.0 - step(1.0, abs(brushCoord.x))) * (1.0 - step(1.0, abs(brushCoord.y)));
	vec4 indirection = texture2D(tUVLookup, brushCoord.xy * 0.5 + 0.5);
	float idz = indirection.b * 2.0 - 1.0;
	//the indirection map also includes depth, so we can do occlusion! (it's also required)
#ifdef USE_W  //screenspace+screensize uses a much deeper projection matrix
	float bias = 0.00004;
#else
	float bias = 0.0001;
#endif
	if(inRect == 0.0 || indirection.b == 0.0 || idz < bz - bias)		//b=0 means cull
	{ 
		return brushCoord.xy; 
	}	
	
	//multiplier is so we can clearly indicate out-of-bounds in the indirection map
	brushCoord.xy = mix(brushCoord.xy, (vec2(indirection.x, 1.0-indirection.y) * 2.0 - 1.0) * INDIRECTION_MULTIPLIER, uUseLookup);
#endif
	vec2 dPx = dFdx(brushCoord.xy);
	vec2 dPy = dFdy(brushCoord.xy);
	brushCoord.xy = distortUV(brushCoord.xy, warp, seed);
	vec2 dP = dPx + dPy;
	float ddr = length(dP) * 0.707;
	//bleed (extra samples to catch subtle AA) falls off rapidly based on brush pixel size
#ifndef USE_TEXTURE
	float bleed = clamp(4.0 * ddr, 0.4, 2.0) + 1.0;    
	
#else
	float bleed = 1.0;
#endif
	vec2 bloodyCoords = brushCoord.xy;
	
	float inSplot = float(bleed >= max(abs(bloodyCoords.x), abs(bloodyCoords.y)));
	inSplot *= step(minZ, (brushCoord.z)) * (1.0-step(maxZ, brushCoord.z));
	
	float feather;
	
	//multi-sample very small brushes at any hardness, and large brushes when fully hard
#ifndef USE_TEXTURE
	HINT_BRANCH
	if((1.0 - hardness) < 5.0 * ddr)
	{
		//let's try just doing one sample, since distancewToValue multi-samples anyway.
		//TODO:  keep this if Joe approves
		float r0 = length(brushCoord.xy);
//		float dR = ddr * 0.354; //brush-space AA delta, in brush radii
		float f1 = distanceToValue(r0, ddr, hardness);
//		float f2 = distanceToValue(r0-dR, ddr, hardness) * 0.5;
		feather = f1;
		
	}
	else
#endif
	{

#ifdef USE_TEXTURE
		vec2 dPx = dFdx(brushCoord.xy);
		vec2 dPy = dFdy(brushCoord.xy);
		vec2 dP = dPx + dPy;
		float ddr = length(dP) * 0.707;
#endif
		feather = sampleBrush(brushCoord.xy, hardness, frame, ddr);
	} 
	
	total.y = max(total.y, opacity * inSplot);
	feather *= inSplot;
		

	total.r = mix(total.r, 1.0, flow*feather * step(0.0, feather));
	return brushCoord.xy;
}
#ifdef USE_FALLOFF
float calcFalloff(vec3 ref, vec3 test)
{
	float dotProduct = dot(ref, test);
	return angleFalloff(dotProduct, uMaxAngle, uFalloffAmount);
}
#else
#define calcFalloff(r, t) 1.0
#endif

BEGIN_PARAMS
INPUT0(vec3, fNormal)
INPUT1(vec3, fTangent)
INPUT2(vec3, fBitangent)
#define SPLOT_TYPE vec4
	INPUT3(SPLOT_TYPE, fBrushCoord0)
//overlay only has one splot and doesn't have the tex coord
#ifdef USE_OVERLAY
	INPUT4(vec2, fTexCoord)
#endif

#if(SPLOT_COUNT > 1)
	INPUT4(SPLOT_TYPE, fBrushCoord1)
#endif

#if(SPLOT_COUNT > 2)
	INPUT5(SPLOT_TYPE, fBrushCoord2)
#endif
#if(SPLOT_COUNT > 3)
	INPUT6(SPLOT_TYPE, fBrushCoord3)
#endif
#if(SPLOT_COUNT > 4)
	INPUT7(SPLOT_TYPE, fBrushCoord4)
#endif
#if(SPLOT_COUNT > 5)
	INPUT8(SPLOT_TYPE, fBrushCoord5)
#endif
#if(SPLOT_COUNT > 6)
	INPUT9(SPLOT_TYPE, fBrushCoord6)
#endif
#if(SPLOT_COUNT > 7)
	INPUT10(SPLOT_TYPE, fBrushCoord7)
#endif
#if(SPLOT_COUNT > 8)
	INPUT11(SPLOT_TYPE, fBrushCoord8)
#endif
#if(SPLOT_COUNT > 9)
	INPUT12(SPLOT_TYPE, fBrushCoord9)
#endif
#if(SPLOT_COUNT > 10)
	INPUT13(SPLOT_TYPE, fBrushCoord10)
#endif
#if(SPLOT_COUNT > 11)
	INPUT14(SPLOT_TYPE, fBrushCoord11)
#endif
#if(SPLOT_COUNT > 12)
	INPUT15(SPLOT_TYPE, fBrushCoord12)
#endif
#if(SPLOT_COUNT > 13)
	INPUT16(SPLOT_TYPE, fBrushCoord13)
#endif
#if(SPLOT_COUNT > 14)
	INPUT17(SPLOT_TYPE, fBrushCoord14)
#endif
#if(SPLOT_COUNT > 15)
	INPUT18(SPLOT_TYPE, fBrushCoord15)
#endif

#ifdef USE_OVERLAY
	OUTPUT_COLOR0(vec4)
#else
#ifdef OUTPUT_UVS
	OUTPUT_COLOR0(vec4)
#else
	OUTPUT_COLOR0(vec4)
#endif
	OUTPUT_COLOR1(vec4)
#endif
END_PARAMS
{
	vec2 total = vec2(0.0, 0.0);	//flow, opacity
//we always have at least one splot, and that splot HAS to run in overlay
	vec3 normHere = fNormal;
	
	float l = length(normHere);
	if(l > 0.0001)
		normHere /= l;
	vec2 sampledCoord = fBrushCoord0.xy/fBrushCoord0.w;

#ifdef USE_FALLOFF
	vec2 texCoord = IN_POSITION.xy/vec2(uTargetSize);
#ifdef USE_OVERLAY
	texCoord = fTexCoord;
#endif
	GET_TEST_NORMAL
#endif


#define doSplot(n)\
{\
	vec3 refNorm = REF_NORM(n);\
	sampledCoord = addBrushAlpha(IN_POSITION.xy, fBrushCoord##n, uHardness[n], uBrushFrame[n], uBrushSeed[n], \
	uFlow[n] * calcFalloff(refNorm, normHere), uOpacity[n], uWarp[n], total);\
}


#ifdef USE_W
#define sizeMult(n) fBrushCoord##n.w * strokePadding
#else
#define sizeMult(n) strokePadding
#endif

//early out is different for thin strokes
#ifdef THIN_STROKE
	#define BRUSH_RADIUS(n) (1.0f + 0.45f * (1.1f - uHardness[n])) * 2.f
#else
	#define BRUSH_RADIUS(n) (1.0f + 0.45f * (1.1f - uHardness[n]))
#endif
	
#define inSplot(n) (BRUSH_RADIUS(n)*sizeMult(n) * (1.0+warpPadding*uWarp[n]) >= max(abs(fBrushCoord##n.x), abs(fBrushCoord##n.y)))

//big performance boost by having the early out outside the addBrushAlpha function
#define maybeDoSplot(n) \
 	if( inSplot(n) != 0.0)\
 	{ doSplot(n); } 
	
	
#ifdef USE_OVERLAY
	doSplot(0)
#else
	
//this optimization doesn't work with screen projection modes, and that's okay.    
#ifndef USE_W
    float minCoord = 900.0;
    #define splotThing(n) minCoord = min(minCoord, fBrushCoord##n.x*fBrushCoord##n.x + fBrushCoord##n.y*fBrushCoord##n.y);
    DO_ALL_SPLOTS
    #undef splotThing
    if(minCoord > 9.0)
    { discard; }
#endif
	#define splotThing(n) maybeDoSplot(n)
	//add in alpha for each splot we're processing
	DO_ALL_SPLOTS
#endif

#ifndef USE_OVERLAY	
	OUT_COLOR0 = vec4(0.0, 0.0, 0.0, 0.0);
	OUT_COLOR0.r = saturate(total.r);
	float op = max(total.g, 1.0/255.0);
	OUT_COLOR1 = vec4(1.0, op, op, op);	//opacity output is also a UV coverage mask
#ifdef OUTPUT_UVS
	unsigned int matFrameCount = max(uMaterialFrameCount, 1);
	float sampleWidth = 1.0 / float(matFrameCount);
	float sampleStart = sampleWidth * float(uMaterialFrame%matFrameCount);
	vec2 matCoord = sampledCoord.xy * 0.5 + 0.5;
	matCoord.x = sampleStart + matCoord.x * sampleWidth;
	
	//discard here if no paint so that we don't potentially mess up the UVs 
	//(can happen if the UVs are reused in an area near but not actually in the splot)
	if(total.r == 0.0)
	{ discard; }
	OUT_COLOR0.gba = saturate(vec3(matCoord.xy, op));
#endif
	
#else
	//preview the brush outline by finding edges
	float dtx = abs(dFdx(total.r));
	float dty = abs(dFdy(total.r));
	float fval = 0.0;
	float thresh = 0.1;
	float jiggle = 1.0;		//thicken the line a bit
	if((total.r-dtx*jiggle <= thresh && total.r+dtx*jiggle > thresh) || (total.r-dty*jiggle <= thresh && total.r+dty*jiggle > thresh))
		fval = 1.0;
	
	if(total.r + fval < thresh)
	{ discard; }
	vec4 overlayColor = uOverlayColor;
#ifdef USE_FALLOFF

	//temporary:  display the test and ref normals as part of the overlay
	/*
	overlayColor.rgb = normHere.xyz * 0.5 + 0.5;
	float dcdp = length(dFdx(fBrushCoord0.xy)+dFdy(fBrushCoord0.xy));
	float innerRadius = dcdp * 20.0;
	if(length(fBrushCoord0.xy) < innerRadius)
		overlayColor.rgb = REF_NORM(0).xyz * 0.5 + 0.5;
	if(abs(length(fBrushCoord0.xy)-innerRadius) < dcdp)
	{ overlayColor.rgb = vec3(0, 0, 0); }
	*/

#endif
	overlayColor.a += fval;
//	overlayColor.a = 1.0;
	OUT_COLOR0 = overlayColor;
	
#endif
	
	

}
