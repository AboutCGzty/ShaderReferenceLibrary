#include "data/shader/mat/state.frag"
#include "data/shader/mat/state.comp"
#include "data/shader/scene/raytracing/common.comp"
#include "data/shader/scene/raytracing/bsdf/microfacet.comp"

void	ReflectionGGXEvaluate( in FragmentState fs, inout SampleState ss )
{
	float roughness  = 1.0 - _p(fs.gloss);
	float alpha 	 = max( roughness * roughness, 1e-3 );
	float bsdfWeight = fs.reflectionOcclusion;
	evaluateBRDF_GGX( ss, _p(fs.reflectivity), _p(fs.fresnel), alpha, _p(fs.eta), bsdfWeight, _p(ss.reflectionWeight) );
}

void	ReflectionGGXSample( in FragmentState fs, inout SampleState ss )
{
	float roughness = 1.0 - _p(fs.gloss);
	float alpha 	= max( roughness * roughness, 1e-3 );
	sampleBRDF_GGX( ss, alpha );
}

#ifdef SUBROUTINE_SECONDARY
	#define ReflectionEvaluateSecondary	ReflectionGGXEvaluateSecondary
	#define ReflectionSampleSecondary	ReflectionGGXSampleSecondary
#else
	#define ReflectionEvaluate			ReflectionGGXEvaluate
	#define ReflectionSample			ReflectionGGXSample
#endif
