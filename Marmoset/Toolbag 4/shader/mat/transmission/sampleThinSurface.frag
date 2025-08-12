#include "data/shader/mat/state.frag"
#include "data/shader/mat/state.comp"
#include "data/shader/scene/raytracing/common.comp"
#include "data/shader/scene/raytracing/bsdf/diffuse.comp"
#include "data/shader/scene/raytracing/bsdf/microfacet.comp"
#include "data/shader/scene/raytracing/bsdf/thinsurface.comp"

#ifdef RT_TRANSMISSION_ANISO
#include "data/shader/mat/reflection/anisoParams.frag"
#endif

void	TransmissionThinSurfaceEvaluate( in FragmentState fs, inout SampleState ss )
{	
	evaluateBTDF_ThinDiffuse( ss, fs.transmissivity, fs.thinScatter );

	float roughness = thinRoughness( fs.gloss, fs.eta );
	#if defined(RT_TRANSMISSION_ANISO)
	{
		float alpha, ax, ay;
		anisoRoughnessToA( roughness, alpha, ax, ay );
		vec3 basisX, basisY;
		anisoGetBasis( fs.vertexTexCoord, ss.basis, basisX, basisY );
		evaluateBTDF_ThinAnisoGGX( ss, fs.transmissivity, alpha, ax, ay, basisX, basisY, 1.0 - fs.thinScatter );
	}
	#else
	{
		float alpha = max( roughness * roughness, 1e-3 );
		evaluateBTDF_ThinGGX( ss, fs.transmissivity, alpha, 1.0 - fs.thinScatter );
	}
	#endif
}

void	TransmissionThinSurfaceSample( in FragmentState fs, inout SampleState ss )
{
	if( ss.r.x < fs.thinScatter )
	{
		ss.r.x *= rcp(fs.thinScatter); //reuse random number
		sampleBTDF_Diffuse( ss );
	}
	else
	{
		ss.r.x = ( ss.r.x - fs.thinScatter ) * rcp( 1.0 - fs.thinScatter ); //reuse random number
		float roughness = thinRoughness( fs.gloss, fs.eta );
		#if defined(RT_TRANSMISSION_ANISO)
		{
			float alpha, ax, ay;
			anisoRoughnessToA( roughness, alpha, ax, ay );
			vec3 basisX, basisY;
			anisoGetBasis( fs.vertexTexCoord, ss.basis, basisX, basisY );
			sampleBRDF_AnisoGGX( ss, ax, ay, basisX, basisY );
		}
		#else
		{
			float alpha = max( roughness * roughness, 1e-3 );
			sampleBRDF_GGX( ss, alpha );
		}
		#endif

		//reflect L into lower hemisphere
		ss.L = reflectVec( -ss.L, ss.basis.N );
		ss.NdotL = dot( ss.basis.N, ss.L );
	}
}

#if defined(REFLECTION)
	#define TransmissionEvaluate	TransmissionThinSurfaceEvaluate
	#define TransmissionSample		TransmissionThinSurfaceSample
	#define TransmissionThinSurface
#else
	#include "samplePassthrough.frag"
#endif
