#include "data/shader/mat/state.frag"
#include "data/shader/mat/state.comp"
#include "data/shader/scene/raytracing/common.comp"
#include "data/shader/scene/raytracing/bsdf/microfacet.comp"

#ifdef RT_TRANSMISSION_ANISO
#include "data/shader/mat/reflection/anisoParams.frag"
#endif

#ifdef RT_TRANSMISSION_ANISO
void	TransmissionAnisoGGXEvaluate( in FragmentState fs, inout SampleState ss )
{
	float roughness = 1.0 - fs.gloss;
	float a, ax, ay;
	anisoRoughnessToA( roughness, a, ax, ay );

	vec3 basisX, basisY;
	anisoGetBasis( fs.vertexTexCoord, ss.basis, basisX, basisY );

	evaluateBTDF_AnisoGGX(	ss,
							fs.transmissivity, fs.eta,
							a, ax, ay,
							basisX, basisY );
}

void	TransmissionAnisoGGXSample( in FragmentState fs, inout SampleState ss )
{
	float roughness = 1.0 - fs.gloss;
	float a, ax, ay;
	anisoRoughnessToA( roughness, a, ax, ay );

	vec3 basisX, basisY;
	anisoGetBasis( fs.vertexTexCoord, ss.basis, basisX, basisY );

	sampleBTDF_AnisoGGX( ss, ax, ay, fs.eta, basisX, basisY );
}
#else
void	TransmissionGGXEvaluate( in FragmentState fs, inout SampleState ss )
{
	float roughness	= 1.0 - fs.gloss;
	float alpha		= max( roughness * roughness, 1e-3 );
	evaluateBTDF_GGX( ss, fs.transmissivity, alpha, fs.eta );
}

void	TransmissionGGXSample( in FragmentState fs, inout SampleState ss )
{
	float roughness = 1.0 - fs.gloss;
	float alpha		= max( roughness * roughness, 1e-3 );
	sampleBTDF_GGX( ss, alpha, fs.eta );
}
#endif

#if defined(REFLECTION)
	#define TransmissionRefraction
	#if defined(RT_TRANSMISSION_ANISO)
		#define TransmissionEvaluate	TransmissionAnisoGGXEvaluate
		#define TransmissionSample		TransmissionAnisoGGXSample
	#else
		#define TransmissionEvaluate	TransmissionGGXEvaluate
		#define TransmissionSample		TransmissionGGXSample
	#endif
#else
	#include "samplePassthrough.frag"
#endif
