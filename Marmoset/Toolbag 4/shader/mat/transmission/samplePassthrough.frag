#include "data/shader/mat/state.frag"
#include "data/shader/mat/state.comp"
#include "data/shader/scene/raytracing/common.comp"
#include "data/shader/scene/raytracing/bsdf/passthrough.comp"

void	TransmissionPassthroughEvaluate( in FragmentState fs, inout SampleState ss )
{
	evaluateBTDF_Passthrough( ss, fs.transmissivity.rgb );
}

void	TransmissionPassthroughSample( in FragmentState fs, inout SampleState ss )
{
	sampleBTDF_Passthrough( ss );
}

#define TransmissionEvaluate	TransmissionPassthroughEvaluate
#define TransmissionSample		TransmissionPassthroughSample
#define TransmissionPassthrough
