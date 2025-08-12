USE_TEXTURE2D(tAlphaMap);

uniform vec2	uCoordScale;
uniform vec2	uCoordOffset;
uniform vec4	uAlphaSwizzle;
uniform vec2	uUseAlbedoAlpha;
uniform vec2	uShadowCatcherFadeParams;	// { FadeRadius, FadeFalloff }

BEGIN_PARAMS
	INPUT0(vec2,fCoord)
	OUTPUT_COLOR0(float)
END_PARAMS
{
	vec2 tc = uCoordScale * fCoord + uCoordOffset;

	float alpha = dot( texture2D( tAlphaMap, tc ), uAlphaSwizzle );
	alpha *= uUseAlbedoAlpha.y; //alpha scale here

	float fadeRadius  = uShadowCatcherFadeParams.x;
	float fadeFalloff = uShadowCatcherFadeParams.y;
	if( fadeRadius >= 0.0 )
	{
		vec2  fadeCoords  = fadeRadius * (tc * 2.0 - 1.0);
		float edgeFade    = saturate( pow( dot(fadeCoords, fadeCoords), fadeFalloff ) );
		alpha            *= 1.0 - edgeFade;
	}

	OUT_COLOR0.r = alpha;
}
