#include "clonestamputils.sh"
#include "data/shader/common/udim.sh"

#ifdef CLONE_STAMP_DEBUG
	USE_TEXTURE2D(tAlbedoMapDebug);
	uniform float uDestAlbeo;
#endif

uniform uint2 uShape;
uniform float uCloneUVScale;
uniform vec2  uUDIMMTSTile;

#define	PI	3.14159265359
#define FALLOFFCOUNT 32
#define FALLOFFSTART ((FALLOFFCOUNT/4)*3) // we start at PI/2
uniform float uFallOffStickerFactors[FALLOFFCOUNT];

BEGIN_PARAMS
INPUT0(vec3, fNormal)
INPUT1(vec3, fTangent)
INPUT2(vec3, fPosition)
INPUT3(vec4, fBrushCoord0)
INPUT4(vec4, fCloneData)

OUTPUT_COLOR0(vec4)	
OUTPUT_COLOR1(uint2)	
#ifdef CLONE_STAMP_DEBUG
	OUTPUT_COLOR2(vec4)
#endif
END_PARAMS
{
    OUT_COLOR0.rg = fract(fBrushCoord0.xy);

	uint uvISlandId = floor(fCloneData.w);

	uint arrayOffset;
	calculateUDIMArrayOffset( fBrushCoord0.xy + uUDIMMTSTile, uShape.x, uShape.y, arrayOffset );

	OUT_COLOR1.rg = uint2(arrayOffset, uvISlandId);

	float maxUVOffset = uCloneUVScale*0.5f;

	float fallOff = 1.f;
	vec2 stickerUVsFallOff = fPosition.xy;
	//The entire brush sticker now occupies the range [-1, 1], centered at (0, 0)
	stickerUVsFallOff = stickerUVsFallOff / maxUVOffset; 
	if( any(stickerUVsFallOff) )
	{
		float dist = length(stickerUVsFallOff);
		vec2 fallOffVec = ( dist > 0.f ? stickerUVsFallOff / dist : 0.f );
		float cosTheta = clamp(fallOffVec.x, -1.f, 1.f);
		float sinTheta = clamp(fallOffVec.y, -1.f, 1.f);
		float theta = acos(cosTheta);
		if( sinTheta < 0.0 )
		{ theta = 2.0 * PI - theta; }

		float angleUnit = (2.0 * PI) / float(FALLOFFCOUNT);
		
		uint fallOffId = (uint(floor(theta / angleUnit)) + uint(FALLOFFSTART)) % FALLOFFCOUNT;
		uint fallOffNextId = (fallOffId+1) % FALLOFFCOUNT;
		float angleProp = saturate((theta - angleUnit * floor(theta / angleUnit)) / angleUnit); // [0,1]

		float fallOffStickerFactor = lerp( uFallOffStickerFactors[fallOffId], uFallOffStickerFactors[fallOffNextId], angleProp );

		if( fallOffStickerFactor >= maxUVOffset ) // no hit => no smoothstep 
		{ fallOff = 1.f; }
		else
		// TODO : fall off should probably be exposed
		{ fallOff = 1.f - smoothstep( max(0.f, fallOffStickerFactor - maxUVOffset*0.1f), fallOffStickerFactor, length(fPosition.xy) ); }	
	}

	OUT_COLOR0.b = saturate(fallOff);

	vec3 UVUp = normalize( fCloneData.xyz );
	vec3 bitangent = normalize(cross(fNormal, fTangent));
	float cosAngle = clamp( dot( normalize( fTangent ), UVUp ), -1.f, 1.f );
	float sinAngle = clamp( dot( normalize( bitangent ), UVUp ), -1.f, 1.f );

	float angleFromCos = acos(cosAngle) * (sinAngle < 0.f ? -1.f : 1.f);
	OUT_COLOR0.a = ((angleFromCos / PI) + 1.f) * 0.5f; // [-PI, PI] => [0, 1]

#ifdef CLONE_STAMP_DEBUG
	OUT_COLOR2.rgb = texture2DLod( tAlbedoMapDebug, uDestAlbeo ? fBrushCoord0.zw : fBrushCoord0.xy + uUDIMMTSTile, 0.0 ).rgb;
	OUT_COLOR2.a = fallOff;
#endif
}
