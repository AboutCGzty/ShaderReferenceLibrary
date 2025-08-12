#ifndef _CLONESTAMP_UTILS_SH
#define _CLONESTAMP_UTILS_SH

uniform vec4	uModelUVRange;
uniform vec4	uModelUVRangeNoComp;

vec4 computeUnitModelUVs(vec2 texCoords, vec4 modelUVRange)
{
	vec2 scaleUV = modelUVRange.zw;
	vec2 offset = modelUVRange.xy;

	vec4 unitTexCoords = vec4(texCoords, 0.0, 1.0);

	// [0, 1]
	unitTexCoords.x = (unitTexCoords.x - offset.x) / scaleUV.x;
	unitTexCoords.y = (unitTexCoords.y - offset.y) / scaleUV.y;

	unitTexCoords.y = 1.f - unitTexCoords.y;

	return unitTexCoords;
}

void getBilinearFilteringData( vec2 texCoords, float w, float h, inout vec4 weight, inout uint4 offsets )
{
	vec2 minDim = vec2( 0.f, 0.f );
	vec2 maxDim = vec2( max(w - 1.f,0.f), max(h - 1.f,0.f) );
	vec2 pixelPos = fract(texCoords.xy) * vec2(w, h) - vec2(0.5f, 0.5f);
	vec2 pixelPosNearestF = clamp( pixelPos, minDim, maxDim );

	uint2 pixelPosNearestI = uint2( pixelPosNearestF );

	vec2 fracPosNearestI = pixelPosNearestF - vec2( pixelPosNearestI );
	float wuwv = fracPosNearestI.x * fracPosNearestI.y;

	weight.x = 1.f - fracPosNearestI.x - fracPosNearestI.y + wuwv;		// (1-fracPosNearestI.x)*(1-fracPosNearestI.y)
	weight.y = fracPosNearestI.x - wuwv;								// fracPosNearestI.x*(1-fracPosNearestI.y)
	weight.z = fracPosNearestI.y - wuwv;								// fracPosNearestI.y*(1-fracPosNearestI.x)
	weight.w = wuwv;													// fracPosNearestI*fracPosNearestI.y

	offsets.x = pixelPosNearestI.x;
	offsets.y = offsets.x + 1;
	offsets.z = pixelPosNearestI.y;
	offsets.w = offsets.z + 1;

	offsets.yw = clamp( offsets.yw, uint2(minDim), uint2(maxDim) );
}

#if defined( CLONE_STAMP_DEST )
USE_TEXTURE2D(tCloneSrcTexture);
USE_TYPEDTEXTURE2D( uint, tCloneSrcIdsTexture );

uniform vec4	uCloneUVOffsetSampleBrush;
uniform vec4	uCloneUVOffsetCompositeSrcDest;
uniform float	uCloneUVReScale;
uniform vec2	uCloneTexturesSize;
uniform uint	uSrcUVIslands;

bool getSrcModelUVs( vec2 destStickerUVs, inout vec4 srcModelUVs, inout uint2 srcIds, float splotAlpha )
{
	// 1. Cancel vec2 matCoord = sampledCoord.xy * 0.5 + 0.5; in layerpaint3d.frag
	// 2. Withdraw uCloneUVOffsetCompositeSrcDest to be in the same range that SRC : [-1,1]
    destStickerUVs = (destStickerUVs * 2.0 - 1.0) - uCloneUVOffsetCompositeSrcDest.xy;	// => [-uvScale*0.5f, uvScale*0.5f]
	destStickerUVs /= uCloneUVReScale;									// [-uvScale*0.5f, uvScale*0.5f] => [-1,1]
	destStickerUVs = destStickerUVs * 0.5 + 0.5;						// [-1,1] => [0,1]

    // Outside the current Dest brush sticker (triangle at the border)
    if( destStickerUVs.x<0.f || destStickerUVs.y<0.f || destStickerUVs.x>1.f || destStickerUVs.y>1.f )
    { return false; }

    destStickerUVs = vec2(destStickerUVs.x, 1.0 - destStickerUVs.y);

	srcModelUVs = vec4(0,0,0,0);
	srcIds = uint2(0,0);

	// We cannot sample tCloneSrcTexture with a "texture2D" call because of the UVIslands 
	// We must check first if all the 2x2 pixels used for the bilinear filtering are in the same UVIsland
	// If it's the case, we compute our own bilinear filtering
	float w = uCloneTexturesSize.x;
	float h = uCloneTexturesSize.y;

	vec4 weight;
	uint4 offsets;
	getBilinearFilteringData( destStickerUVs, w, h, weight, offsets );

	int2 offsetsArray[4] = { int2(offsets.x, offsets.z), int2(offsets.y, offsets.z), int2(offsets.x, offsets.w), int2(offsets.y, offsets.w) };

	vec4 srcValues[4];
	uint2 srcValuesIds[4];
	for( uint i=0; i<4; ++i )
	{
		int2 currentOffsets = offsetsArray[i];

		srcValues[i] = imageLoad( tCloneSrcTexture, currentOffsets );
		srcValuesIds[i] = uint2(imageLoad( tCloneSrcIdsTexture, currentOffsets ).xy);
	}

	uint refTileId = srcValuesIds[0].x;
	uint refUVIslandId = srcValuesIds[0].y;
	srcIds = srcValuesIds[0];

	float totalW = 0.f;
	for( uint i=0; i<4; ++i )
	{
		float currentW = weight[i];

		if( srcValuesIds[i].x == refTileId && srcValuesIds[i].y == refUVIslandId )
		{ 
			srcModelUVs += srcValues[i] * currentW; 
			totalW += currentW; 
		}
	}

	if( totalW > 0.f )
	{ srcModelUVs /= totalW; }

	srcModelUVs.z *= splotAlpha;

	return true;
}
#endif

#endif // _CLONESTAMP_UTILS_SH
