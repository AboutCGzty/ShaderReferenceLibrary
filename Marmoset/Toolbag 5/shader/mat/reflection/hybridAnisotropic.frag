#include "data/shader/common/octpack.sh"
#include "data/shader/common/packed.sh"
#include "data/shader/mat/hybridConstants.comp"
#include "data/shader/mat/reflection/sampleAnisotropic.frag"

uint4 ReflectionAnisoGGXSample( in PathState path, in FragmentState fs, inout SampleState ss, inout uint specularLobe )
{
	float roughness = 1.0 - _p( fs.gloss );
	vec3  a = anisoRoughnessToA( roughness, _p( fs.anisoAspect ) );

	vec3  basisX, basisY;
#ifdef MATERIAL_TEXTURE_MODE_TRIPLANAR
	anisoGetBasis( ss.basis, fs.vertexTexCoord.projectorToShadingRotation, _p( fs.anisoDirection ), basisX, basisY );
#else
	anisoGetBasis( ss.basis, _p( fs.anisoDirection ), basisX, basisY );
#endif

	if( path.isNonSpecular )
	{
		regularizeAnisoGGX( a );
	}

	sampleBRDF_AnisoGGX( ss, a.x, a.y, basisX, basisY );
	ss.flagSpecular = isSpecularGGX( a.z );

	// additional hybrid
	specularLobe |= HYBRID_ANISOTROPIC_FLAG;
#if defined( ReflectionSampleSecondary )
	fs.sampledGloss = fs.glossSecondary;
#else
	fs.sampledGloss = fs.gloss;
#endif
	// variance, packed anisotropy, tangent basis, bitangent basis
	return uint4( asuint( 0.1f ), packVec2f( vec2( a.x, a.y ) ), packUnitVectorOct( basisX ), packUnitVectorOct( basisY ) );
}