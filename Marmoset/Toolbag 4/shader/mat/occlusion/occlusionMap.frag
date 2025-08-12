#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tAmbientOcclusionTexture);
uniform vec4	uAmbientOcclusionSwizzle;
uniform vec2	uAmbientOcclusionStrength;
uniform float	uAmbientOcclusionUseSecondaryUV;
uniform float	uAmbientOcclusionVertexEnable;
uniform vec4	uAmbientOcclusionVertexSwizzle;

USE_TEXTURE_MATERIAL(tCavityTexture);
uniform vec4	uCavitySwizzle;
uniform vec4	uCavityStrength;

void	OcclusionMap( inout FragmentState s )
{
	vec2 tc = mix( s.vertexTexCoord, s.vertexTexCoordSecondary, uAmbientOcclusionUseSecondaryUV );
	float ao = dot( textureMaterial( tAmbientOcclusionTexture, tc ), uAmbientOcclusionSwizzle );
	ao *= dot( s.vertexColor, uAmbientOcclusionVertexSwizzle ) + uAmbientOcclusionVertexEnable;
	ao = ao * uAmbientOcclusionStrength.x + uAmbientOcclusionStrength.y;
	#if defined(OCCLUSION_EXPORT)
		//output ao instead of applying it
		s.output2.a = sqrt(ao);
	#elif defined(MSET_RAYTRACING)
		s.skyOcclusion *= ao;
	#else
		s.diffuseLight *= ao;
	#endif
	#if !defined(MSET_RAYTRACING)
		s.occlusion = ao;
	#endif
}
#define	Occlusion	OcclusionMap

void	CavityMap( inout FragmentState s )
{
	//cavity mapping
	float cav = dot( textureMaterial( tCavityTexture, s.vertexTexCoord ), uCavitySwizzle );
	float diff = cav * uCavityStrength.x + uCavityStrength.y;
	float spec = cav * uCavityStrength.z + uCavityStrength.w;
	#if defined(OCCLUSION_EXPORT)
		//export; apply cavity to surface instead
		s.albedo.rgb *= diff;
		s.reflectivity *= spec;
	#elif defined(MSET_RAYTRACING)
		s.albedo.rgb *= diff;
		s.reflectionOcclusion *= spec;
	#else
		s.diffuseLight *= diff;
		s.specularLight *= spec;
	#endif
	#if !defined(MSET_RAYTRACING)
		s.cavity = cav;
	#endif
}
#define	Cavity	CavityMap