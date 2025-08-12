#include "data/shader/mat/state.frag"
#include "data/shader/mat/layerblend.frag"

#if defined(SHADER_PIXEL) || defined(SHADER_COMPUTE)

struct VertexColorCompositorParams
{
	uint channel;						// vertex color channel
	vec2 brightnessContrastScaleBias;	// brightness + contrast
};
void VertexMaterialComposite( in VertexColorCompositorParams params, uint2 blendOperators, in FragmentState state, inout MaterialState material, in MaterialState layerMaterial, uint layerIndex )
{
	float blendingCoefficient = 0.0;
	switch( params.channel )
	{
		case 0: blendingCoefficient = state.vertexColor.r; break;
		case 1: blendingCoefficient = state.vertexColor.g; break;
		case 2: blendingCoefficient = state.vertexColor.b; break;
		case 3: blendingCoefficient = state.vertexColor.a; break;
	}
    blendingCoefficient = saturate( params.brightnessContrastScaleBias.x * blendingCoefficient + params.brightnessContrastScaleBias.y );
	LayerBlendStates( state, blendOperators, material, layerMaterial, blendingCoefficient );
}

#define	CompositorParams					VertexColorCompositorParams
#define	MaterialComposite(p,s,m,lm,l)		VertexMaterialComposite(p.compositor,p.blendOperators,s,m,lm,l)

#endif
