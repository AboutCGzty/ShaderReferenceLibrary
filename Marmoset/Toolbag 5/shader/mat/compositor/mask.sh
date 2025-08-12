#include "data/shader/mat/state.frag"
#include "data/shader/mat/layerblend.frag"

#if defined(SHADER_PIXEL) || defined(SHADER_COMPUTE)

struct MaskCompositorParams
{
	uint texture;						// texture id + encoded swizzle
	uint uvSet;							// UV Set id
	vec2 brightnessContrastScaleBias;	// brightness + contrast
};
void MaskMaterialComposite( in MaskCompositorParams params, uint2 blendOperators, in FragmentState state, inout MaterialState material, in MaterialState layerMaterial, uint layerIndex )
{
	const vec4 uvSet = ( params.uvSet == 0 ? state.vertexTexCoordBase : state.vertexTexCoordSecondary );
	float blendingCoefficient = textureMaterial( params.texture, uvSet, 1.0 );
    blendingCoefficient = saturate( params.brightnessContrastScaleBias.x * blendingCoefficient + params.brightnessContrastScaleBias.y );
	LayerBlendStates( state, blendOperators, material, layerMaterial, blendingCoefficient );
}

#define	CompositorParams						MaskCompositorParams
#define	MaterialComposite(p,s,m,lm,l)			MaskMaterialComposite(p.compositor,p.blendOperators,s,m,lm,l)

#endif