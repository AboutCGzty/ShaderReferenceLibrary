#include "data/shader/mat/hybridConstants.comp"
#include "data/shader/mat/reflection/sampleGGX.frag"

uint4 ReflectionGGXSample( in PathState path, in FragmentState fs, inout SampleState ss, inout uint specularLobe )
{
	ReflectionGGXSample( path, fs, ss );
	specularLobe |= HYBRID_GGX_FLAG;
#if defined( ReflectionSampleSecondary )
	fs.sampledGloss = fs.glossSecondary;
#else
	fs.sampledGloss = fs.gloss;
#endif
	return uint4( asuint( 0.2f ), 0, 0, 0 );
}