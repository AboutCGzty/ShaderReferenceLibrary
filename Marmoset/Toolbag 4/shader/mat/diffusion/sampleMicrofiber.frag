#include "data/shader/mat/state.frag"
#include "data/shader/mat/state.comp"
#include "data/shader/scene/raytracing/common.comp"
#include "data/shader/scene/raytracing/bsdf/diffuse.comp"
#include "data/shader/scene/raytracing/bsdf/microfiber.comp"

void	DiffusionMicrofiberEvaluate( in FragmentState fs, inout SampleState ss )
{
	float roughness = max( fs.sheenRoughness, 0.07 );
	evaluateBRDF_Microfiber( ss, fs.albedo.rgb, fs.sheen, roughness );
}

void    DiffusionMicrofiberSample( in FragmentState fs, inout SampleState ss )
{
	sampleBRDF_Diffuse( ss );
	ss.flagDiffuse = true;
}

#define DiffusionEvaluate	DiffusionMicrofiberEvaluate
#define DiffusionSample		DiffusionMicrofiberSample
