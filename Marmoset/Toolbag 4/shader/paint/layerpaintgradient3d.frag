///////////////////////////
//setup similar to layer effect shader - called directly from paint code - no frills -MM
#include "layer/layer.sh"

//ok - maybe some frills here :) -MM
#include "commonCull.sh"

//some duplication of shader code here - this file is a hybrid of layereffect vs. painter tool -MM
//add this #define directly here (subject to change)..

#define CALC_WS_NORMAL\
	{\
	vec3 TSNormal = texture2D(tTSNormalMap, texCoord).rgb * 2.0 - 1.0;\
	vec3 tangent = fTangent;\
	l = length(tangent);\
	if(l > 0.0001)\
	{ tangent /= l; }\
	vec3 bitang = fBitangent;\
	l = length(bitang);\
	if(l > 0.0001)\
	{ bitang /= l; }\
	normHere = normalize(TSNormal.x * tangent + TSNormal.y * bitang + TSNormal.z * normHere);\
}

uniform vec3	uPlanePos1;
uniform vec3	uPlanePos2;
uniform vec3	uPlaneDir1;
uniform vec3	uPlaneDir2;

uniform vec3	uFrontDir1;
uniform vec3	uFrontDir2;

uniform vec3	uSidePlanePos1;
uniform vec3	uSidePlanePos2;
uniform vec3	uSidePlaneDir1;
uniform vec3	uSidePlaneDir2;


uniform int		uRadialMode;
uniform int		uGradientMode;
uniform int		uBlendExistingAlphas;

uniform vec2	uTileValues;
uniform int		uInvertEffect;
uniform float	uContrast;


uniform int		uOrthoMode;

uniform float 	uMaxAngle;
uniform float	uFalloffAmount;
uniform vec3	uRefNormal; 


USE_TEXTURE2D( tTextureColorGradient );
USE_TEXTURE2D( tTextureAlphaGradient );

USE_TEXTURE2D( tTextureOriginalSrc );
USE_TEXTURE2D( tTextureSelectionMask );

USE_TEXTURE2D( tTSNormalMap );


vec4 sampleGradientMap(float p)
{
	vec2 gradientSampleCoords = vec2(p, 0);
	vec4 result = texture2DLod( tTextureColorGradient, gradientSampleCoords, 0.0 );
	return result;
}


float gradientSample(vec2 uv)
{
	vec2 coord = uv;
	coord.x = fmod(uv.x, 1);
	coord.y = fmod(uv.y, 1);
	if( coord.x == 0 && uv.x > 0 )
	{ coord.x = 1.0f; }
	if( coord.y == 0 && uv.y > 0 )
	{ coord.y = 1.0f; }
	float result = 0;
	if( uGradientMode == 0 )//linear
	{
		//repeat linear
		result = coord.y;
	}
	else if( uGradientMode == 1 )//radial
	{
		coord.x = fmod(coord.x+0.5f, 1.0f);
		coord.y = fmod(coord.y+0.5f, 1.0f);
		float dx = 0.5f - coord.x;
		float dy = 0.5f - coord.y;
		//float dx = coord.x - 0.5f;
		//float dy = coord.y - 0.5f;
		float len = sqrt((dx*dx)+(dy*dy));
		result = len / 0.5f;
	}
	else if( uGradientMode == 2 )//reflected
	{
		result = coord.y;
	}
	else if( uGradientMode == 3 )//diamond
	{
		coord.x = fmod(coord.x+0.5f, 1.0f);
		coord.y = fmod(coord.y+0.5f, 1.0f);
		float dx = 0.5f - coord.x;
		float dy = 0.5f - coord.y;
		if( dx < 0 )
		{ dx = -dx; }
		if( dy < 0 )
		{ dy = -dy; }
		result = (dx+dy)*2;
	}
	else// ( uGradientMode == 4 )//knurled
	{
		coord.x = fmod(coord.x+0.5f, 1.0f);
		coord.y = fmod(coord.y+0.5f, 1.0f);
		float dx = 0.5f - coord.x;
		float dy = 0.5f - coord.y;
		if( dx < 0 )
		{ dx = -dx; }
		if( dy < 0 )
		{ dy = -dy; }
		result = (dx+dy)*2;
		if( result > 1 )
		{
			dx = 0.5f - dx;
			dy = 0.5f - dy;
			result = (dx+dy)*2;
		}
	}
	if( result > 1 )
	{ result = 1; }
	return result;
}

float planeDot(vec3 pos, vec3 o, vec3 dir)
{
	vec3 d = pos-o;
	float result = (d.x*dir.x)+(d.y*dir.y)+(d.z*dir.z);
	return result;
}

//use 4 planar distances to represent a box - can be out of bounds
float getBoxGradient(vec3 pos)
{
	float yp1 = planeDot(pos, uPlanePos1, uPlaneDir1);
	float yp2 = planeDot(pos, uPlanePos2, uPlaneDir2);
	float xp1 = planeDot(pos, uSidePlanePos1, uSidePlaneDir1);
	float xp2 = planeDot(pos, uSidePlanePos2, uSidePlaneDir2);
	vec2 sampleUV;
	sampleUV.x = 0;
	sampleUV.y = 0;
	if( xp1 < 0 )
	{
		float refDistance = xp2+xp1;
		sampleUV.x = xp1/refDistance;
	}
	else if( xp2 < 0 )
	{
		float refDistance = xp1+xp2;
		sampleUV.x = 1.0 - (xp2/refDistance);
	}
	else
	{ sampleUV.x = xp1 / (xp1+xp2); }
	if( yp1 < 0 )
	{
		float refDistance = yp2+yp1;
		sampleUV.y = yp1/refDistance;
	}
	else if( yp2 < 0 )
	{
		float refDistance = yp1+yp2;
		sampleUV.y = 1.0 - (yp2/refDistance);
	}
	else
	{ sampleUV.y = yp1 / (yp1+yp2); }

	float value = 1;
	if( uGradientMode == 1 )
	{
		sampleUV.x += 0.5;
		sampleUV.x /= 2;
		sampleUV.y /= 2;
		sampleUV.x -= 0.5;
		if( sampleUV.x < 0 )sampleUV.x = -sampleUV.x;
		if( sampleUV.y < 0 )sampleUV.y = -sampleUV.y;
		sampleUV.x *= 2;
		sampleUV.y *= 2;
		if( !(sampleUV.x > 1 || sampleUV.y > 1) )
		{
			sampleUV.x *= uTileValues.x*0.5f;
			sampleUV.y *= uTileValues.y*0.5f;
			value = gradientSample(sampleUV);
		}
	}
	else if( uGradientMode == 3 || uGradientMode == 4 )
	{
		sampleUV.x += 0.5;
		sampleUV.x /= 2;
		sampleUV.y /= 2;
		sampleUV.x += 0.5;
		if( sampleUV.x < 0 )sampleUV.x = -sampleUV.x;
		if( sampleUV.y < 0 )sampleUV.y = -sampleUV.y;
		sampleUV.x *= uTileValues.x;
		sampleUV.y *= uTileValues.y;
		value = gradientSample(sampleUV);
	}
	else
	{
		if( uGradientMode == 0 )
		{
			if( sampleUV.x < 0 )sampleUV.x = 0;
			if( sampleUV.y < 0 )sampleUV.y = 0;
		}
		if( uGradientMode == 2 )
		{
			if( sampleUV.x < 0 )sampleUV.x = -sampleUV.x;
			if( sampleUV.y < 0 )sampleUV.y = -sampleUV.y;
		}
		if( sampleUV.x > 1 )sampleUV.x = 1;
		if( sampleUV.y > 1 )sampleUV.y = 1;
		value = gradientSample(sampleUV);
	}

	return value;
}

float sampleGradient(vec3 pos)
{
	float value = 0;
	value = getBoxGradient(pos);
	return value;
}

float calcFalloff(vec3 ref, vec3 test)
{
	float dotProduct = dot(ref, test);
	float result = angleFalloff(dotProduct, uMaxAngle, uFalloffAmount);
	return result;
}


BEGIN_PARAMS
	INPUT0( vec2, fBufferCoord )
	INPUT1( vec3, fPosition )
	INPUT3( vec3, fNormal )
	INPUT4( vec3, fTangent )
	INPUT5( vec3, fBitangent )	
	OUTPUT_COLOR0( vec4 )
END_PARAMS
{


	float l;
	vec3 normHere = fNormal;
	vec2 texCoord = fBufferCoord;
	CALC_WS_NORMAL;

	vec4 outputColor;
	vec4 selectionMask = texture2DLod( tTextureSelectionMask, fBufferCoord, 0.0 );
	float alphaLerp = selectionMask.x * calcFalloff(uRefNormal, normHere);

	if(alphaLerp <= 0.0)//ignore anything past the fringes - avoid re-dithering
		{ discard; }

	#ifdef LAYER_OUTPUT_16BIT
		bool useOriginalSrc = alphaLerp < 0.0000153;
	#else
		bool useOriginalSrc = alphaLerp < 0.0039;
	#endif

	if( useOriginalSrc )
	{
		outputColor = texture2DLod( tTextureOriginalSrc, fBufferCoord, 0.0 );
	}
	else
	{
		float value = sampleGradient(fPosition);
		outputColor = sampleGradientMap(value);
		if( uInvertEffect != 0 )
		{
			outputColor.x = 1.0f-outputColor.x;
			outputColor.y = 1.0f-outputColor.y;
			outputColor.z = 1.0f-outputColor.z;
		}

		outputColor = lerp( vec4(0.5,0.5,0.5,1.0), outputColor, uContrast );		//amount is noise contrast, i.e. lerp between flat gray and noise
		vec2 gradientSampleCoords = vec2(value, 0);
		vec4 alpha = texture2DLod( tTextureAlphaGradient, gradientSampleCoords, 0.0 );

		//this is subject to change pending design - use the gradient alpha to:
		//(a) get the blend between gradient and existing layer, then
		//(b) use the same gradient alpha to lerp between sampled alpha

		outputColor.w = alpha.x;//this now becomes the gradient alpha that gets blended with original src
		if( outputColor.w != 1 )//some mix with existing data in this layer
		{
			vec4 colorIn = texture2DLod( tTextureOriginalSrc, fBufferCoord, 0.0 );
			outputColor = (colorIn*(1.0f-outputColor.w))+(outputColor*outputColor.w);
			if( uBlendExistingAlphas == 0 )
			{ outputColor.w = alpha.x; }
			if( outputColor.w < alpha.x )
			{ outputColor.w = alpha.x; }
		}
	}

	LayerState state = getLayerState( fBufferCoord );
	state.result = outputColor;
	state.result = compositeLayerState( state );
	OUT_COLOR0 = state.result;
}

