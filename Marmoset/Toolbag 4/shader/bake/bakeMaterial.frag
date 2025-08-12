#include "matValues.frag"
#include "hit.frag"

uint	uMeshIndexBase;

void	MaterialIntersection( inout BakeHit h )
{
	MatValues v = sampleMaterialValues( h.hitTexCoord, h.hitColor );

	h.output0.xyz =
	
		#if defined(MATERIAL_ALBEDO)
			v.albedo;

		#elif defined(MATERIAL_GLOSS)
			vec3( v.gloss, v.gloss, v.gloss );

		#elif defined(MATERIAL_SPECULAR)
			v.specular;

		#elif defined(MATERIAL_ALBEDO_METALNESS)
			v.baseColor;

		#elif defined(MATERIAL_ROUGHNESS)
			vec3( v.roughness, v.roughness, v.roughness );
			
		#elif defined(MATERIAL_METALNESS)
			vec3( v.metalness, v.metalness, v.metalness );

		#elif defined(MATERIAL_EMISSIVE)
			v.emissive;

		#elif defined(MATERIAL_TRANSPARENCY)
			vec3( v.alpha, v.alpha, v.alpha );

		#else
			#error Invalid define for bakeMaterial.frag

		#endif

	h.output0.w = float(uMeshIndexBase + h.hitMeshIndex) * (1.0/255.0);
}

#define Intersection MaterialIntersection