#include "data/shader/mat/hybridConstants.comp"
#include "data/shader/mat/reflection/sampleGlints.frag"


uint4 ReflectionGlintsSample( in PathState path, in FragmentState fs, inout SampleState ss, inout uint specularLobe )
{
	ReflectionGlintsSample( path, fs, ss );
	specularLobe |= HYBRID_GLINTS_FLAG;
#if defined( ReflectionSampleSecondary )
	fs.sampledGloss = fs.glintUseMicrofacet ? fs.glossSecondary : ( 1.0f - fs.glintRoughness );
#else
	fs.sampledGloss = fs.glintUseMicrofacet ? fs.gloss : ( 1.0f - fs.glintRoughness );
#endif
	// variance, glint roughness, -, -
	return uint4( asuint( 0.01f ), asuint( fs.glintUseMicrofacet ? ( 1.0f - fs.gloss ) : fs.glintRoughness ), 0, 0 );
}