USE_TEXTURE2D(tAlphaMap);
USE_TEXTURE2D(tAlbedoMap);

uniform vec2	uCoordScale;
uniform vec2	uCoordOffset;
uniform vec4	uAlphaSwizzle;
uniform vec2	uUseAlbedoAlpha;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)
	OUTPUT_COLOR0(float)
END_PARAMS
{
	vec2 tc = uCoordScale * fCoord + uCoordOffset;

	float alpha = dot( texture2D( tAlphaMap, tc ), uAlphaSwizzle );
	float albedoAlpha = texture2D( tAlbedoMap, tc ).a;
	
	albedoAlpha = saturate( albedoAlpha * uUseAlbedoAlpha.x + uUseAlbedoAlpha.y );
	alpha *= albedoAlpha;

	OUT_COLOR0.r = alpha;
}
