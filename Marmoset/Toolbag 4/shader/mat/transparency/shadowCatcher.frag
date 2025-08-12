//inherits dither.frag

#include "data/shader/common/util.sh"

uniform vec2	uShadowCatcherFadeParams;	// { FadeRadius, FadeFalloff }

void	TransparencyShadowCatcher( inout FragmentState s )
{
	AlphaBase(s);

	//edge fade
	float fadeRadius  = uShadowCatcherFadeParams.x;
	float fadeFalloff = uShadowCatcherFadeParams.y;
	float fadeAlpha   = 1.0;
	if( fadeRadius >= 0.0 )
	{
		vec2  fadeCoords = fadeRadius * (s.vertexTexCoord * 2.0 - 1.0);
		float edgeFade   = saturate( pow( dot(fadeCoords, fadeCoords), fadeFalloff ) );
		fadeAlpha        = 1.0 - edgeFade;
	}
	
	#if defined(MATERIAL_PASS_PREPASS_RT) || \
		defined(MATERIAL_PASS_RT_PRIMARYHIT_RASTER)
		s.albedo.a *= fadeAlpha;
		Transparency( s );
	#else
		float albedoAlpha = s.albedo.a;
		s.albedo.a = fadeAlpha;
		Transparency( s );
		s.albedo.a = albedoAlpha;
	#endif

	#if defined(MATERIAL_PASS_LIGHT)
		//shadow ratio
		s.diffuseLight = (s.diffuseLight + 0.5) / (s.generic0.rgb + 0.5);
		//shadow opacity
		s.diffuseLight = mix( vec3(1.0,1.0,1.0), s.diffuseLight, s.albedo.a );
		s.albedo.a = 1.0 - s.diffuseLight.x;
		#ifndef LightMerge_AlphaOut
			#define LightMerge_AlphaOut
		#endif
	#endif
}

#undef  Transparency
#define Transparency	TransparencyShadowCatcher

#ifndef TransparencyHasAlpha
#define TransparencyHasAlpha
#endif
