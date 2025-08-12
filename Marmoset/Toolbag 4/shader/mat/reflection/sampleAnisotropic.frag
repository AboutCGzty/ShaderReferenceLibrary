#include "data/shader/mat/state.frag"
#include "data/shader/mat/state.comp"
#include "data/shader/scene/raytracing/common.comp"
#include "data/shader/scene/raytracing/bsdf/microfacet.comp"

#include "anisoParams.frag"

void	ReflectionAnisoGGXEvaluate( in FragmentState fs, inout SampleState ss )
{
	float roughness = 1.0 - _p(fs.gloss);
	float a, ax, ay;
	_p(anisoRoughnessToA)( roughness, a, ax, ay );

	vec3 basisX, basisY;
	_p(anisoGetBasis)( fs.vertexTexCoord, ss.basis, basisX, basisY );

	float bsdfWeight = fs.reflectionOcclusion;
	evaluateBRDF_AnisoGGX(	ss, _p(fs.reflectivity), _p(fs.fresnel), _p(fs.eta),
							a, ax, ay, basisX, basisY, bsdfWeight, _p(ss.reflectionWeight) );
}

void	ReflectionAnisoGGXSample( in FragmentState fs, inout SampleState ss )
{
	float roughness = 1.0 - _p(fs.gloss);
	float a, ax, ay;
	_p(anisoRoughnessToA)( roughness, a, ax, ay );

	vec3 basisX, basisY;
	_p(anisoGetBasis)( fs.vertexTexCoord, ss.basis, basisX, basisY );

	sampleBRDF_AnisoGGX( ss, ax, ay, basisX, basisY );
}

#ifdef SUBROUTINE_SECONDARY
	#define ReflectionEvaluateSecondary	ReflectionAnisoGGXEvaluateSecondary
	#define ReflectionSampleSecondary	ReflectionAnisoGGXSampleSecondary
#else
	#define ReflectionEvaluate			ReflectionAnisoGGXEvaluate
	#define ReflectionSample			ReflectionAnisoGGXSample
#endif
