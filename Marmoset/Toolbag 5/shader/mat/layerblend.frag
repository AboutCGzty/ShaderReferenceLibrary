#ifndef LAYERBLEND_FRAG
#define LAYERBLEND_FRAG

#include "data/shader/common/colorspace.sh"
#include "data/shader/mat/layerblendoperators.frag"

// ----------------------------------------------------------------
// Helper
// ----------------------------------------------------------------

#define BASE_LAYER_INDEX 0

// ----------------------------------------------------------------
// Subroutine slots (need to agree with values in MaterialEnum.h)
// ----------------------------------------------------------------
#define SUBROUTINE_DISPLACEMENT_BLEND 0
#define SUBROUTINE_SURFACE_BLEND 1
#define SUBROUTINE_ALBEDO_BLEND 2
#define SUBROUTINE_DIFFUSION_BLEND 3
#define SUBROUTINE_TRANSMISSION_BLEND 4
#define SUBROUTINE_REFLECTION_BLEND 5
#define SUBROUTINE_MICROSURFACE_BLEND 6
#define SUBROUTINE_REFLECTIVITY_BLEND 7
#define SUBROUTINE_CLEARCOAT_REFLECTION_BLEND 8
#define SUBROUTINE_CLEARCOAT_MICROSURFACE_BLEND 9
#define SUBROUTINE_CLEARCOAT_REFLECTIVITY_BLEND 10
#define SUBROUTINE_EMISSION_BLEND 11
#define SUBROUTINE_OCCLUSION_BLEND 12
#define SUBROUTINE_TRANSPARENCY_BLEND 13
#define SUBROUTINE_TEXTURE_BLEND 14
#define SUBROUTINE_MERGE_BLEND 15

#define SUBROUTINE_BLEND_MAX_ENUM 16

// ----------------------------------------------------------------
// Field blending method
// ----------------------------------------------------------------
template<typename T>
T BlendUsingOperator( uint blendOperator, T source, in T dest, float blendingCoefficient, in FragmentState state )
{   
    T blendingCoefficients = (T)blendingCoefficient;
    switch( blendOperator )
    {
        default:
        case MATERIAL_LAYER_BLENDING_MODE_DISABLED:
            return DisabledBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_STANDARD:
            return AlphaBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_ADD:
            return AddBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_MULTIPLY:
            return MultiplyBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_OVERLAY:
            return OverlayBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_SCREEN:
            return ScreenBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_DARKEN:
            return DarkenBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_COLOR_DODGE:
            return ColorDodgeBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_COLOR_BURN:
            return ColorBurnBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_LINEAR_BURN:
            return LinearBurnBlendOperator( source, dest, blendingCoefficients );
    }
}

// ----------------------------------------------------------------
// Vector blending method
// ----------------------------------------------------------------
template<typename T>
T BlendVectorUsingOperator( uint blendOperator, T source, in T dest, float blendingCoefficient, in FragmentState state )
{
    T blendingCoefficients = (T)blendingCoefficient;
    switch( blendOperator )
    {
        default:
        case MATERIAL_LAYER_BLENDING_MODE_DISABLED:
            return DisabledBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_STANDARD:
            return AlphaBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_ADD:
            return VectorAddBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_MULTIPLY:
            return MultiplyBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_OVERLAY:
            return VectorOverlayBlendOperator( source, dest, blendingCoefficients, state.vertexNormal );
        case MATERIAL_LAYER_BLENDING_MODE_SCREEN:
            return ScreenBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_DARKEN:
            return DarkenBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_COLOR_DODGE:
            return ColorDodgeBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_COLOR_BURN:
            return ColorBurnBlendOperator( source, dest, blendingCoefficients );
        case MATERIAL_LAYER_BLENDING_MODE_LINEAR_BURN:
            return VectorLinearBurnBlendOperator( source, dest, blendingCoefficients );
    }
}

// ----------------------------------------------------------------
// Blending entry points
// ----------------------------------------------------------------
template<typename T>
T BlendField( uint blendOperator, T source, in T dest, float blendingCoefficient, in FragmentState state )
{
    return BlendUsingOperator( blendOperator, source, dest, blendingCoefficient, state );
}

template<typename T>
T BlendVector( uint blendOperator, T source, in T dest, float blendingCoefficient, in FragmentState state )
{
    return BlendVectorUsingOperator( blendOperator, source, dest, blendingCoefficient, state );
}

template<typename T>
T BlendFieldViasRBG( uint blendOperator, T source, in T dest, float blendingCoefficient, in FragmentState state )
{   
    T sourceConverted = linearTosRGB( source );
    T destConverted = linearTosRGB( dest );
    T result = BlendUsingOperator( blendOperator, sourceConverted, destConverted, blendingCoefficient, state );
    return sRGBToLinear( result );
}

// ----------------------------------------------------------------
// Layer compositing function
// ----------------------------------------------------------------
void LayerBlendStates( in FragmentState state, uint2 encodedBlendOperators, inout MaterialState material, in MaterialState layerMaterial, float blendingCoefficient )
{
    // Load blend operators for layer - needs to agree with code in SRMerge.h
	const uint BITS_PER_BLEND_OPERATOR = 4;
	const uint BITS_PER_LAYER = BITS_PER_BLEND_OPERATOR * SUBROUTINE_BLEND_MAX_ENUM;
	const uint BITS_PER_UINT = 8 * sizeof( uint );
	const uint ENTRIES_PER_LAYER = BITS_PER_LAYER / BITS_PER_UINT + ( BITS_PER_LAYER % BITS_PER_UINT != 0 ? 1 : 0 );
				
	uint blendOperators[SUBROUTINE_BLEND_MAX_ENUM];
	uint operatorIndex = 0;
		
	HINT_UNROLL
	for( uint shift = 0; shift < BITS_PER_UINT; shift += BITS_PER_BLEND_OPERATOR )
	{
		blendOperators[operatorIndex] = ( ( encodedBlendOperators.x >> shift ) & 0xF );
		++operatorIndex;
	}
		
	HINT_UNROLL
	for( uint shift = 0; shift < BITS_PER_UINT; shift += BITS_PER_BLEND_OPERATOR )
	{
		blendOperators[operatorIndex] = ( ( encodedBlendOperators.y >> shift ) & 0xF );
		++operatorIndex;
	}

    //transparency
    if( blendOperators[SUBROUTINE_TRANSPARENCY_BLEND] == MATERIAL_LAYER_BLENDING_MODE_STANDARD )
    {
        material.albedo.a = BlendField( blendOperators[SUBROUTINE_TRANSPARENCY_BLEND], (float)1.0, material.albedo.a, layerMaterial.albedo.a * blendingCoefficient, state );
    }
    else
    {
        material.albedo.a = BlendField( blendOperators[SUBROUTINE_TRANSPARENCY_BLEND], layerMaterial.albedo.a, material.albedo.a, blendingCoefficient, state );
    }

    //Incorporate alpha channel of albedo into the blending coefficient to account to the transparency of incoming layer
    blendingCoefficient *= layerMaterial.albedo.a;
    
    //albedo
    material.albedo.rgb = BlendFieldViasRBG( blendOperators[SUBROUTINE_ALBEDO_BLEND], layerMaterial.albedo.rgb, material.albedo.rgb, blendingCoefficient, state );
    
    //surface   
    material.normal = normalize( BlendVector( blendOperators[SUBROUTINE_SURFACE_BLEND], layerMaterial.normal, material.normal, blendingCoefficient, state ) );
    material.normalAdjust = layerMaterial.normalAdjust || material.normalAdjust;
    
    //microsurface
    material.glossOrRoughness = BlendField( blendOperators[SUBROUTINE_MICROSURFACE_BLEND], layerMaterial.glossOrRoughness, material.glossOrRoughness, blendingCoefficient, state );
    material.glossOrRoughnessSecondary = BlendField( blendOperators[SUBROUTINE_CLEARCOAT_MICROSURFACE_BLEND], layerMaterial.glossOrRoughnessSecondary, material.glossOrRoughnessSecondary, blendingCoefficient, state );

    //reflectivity
    material.metalness = BlendField( blendOperators[SUBROUTINE_REFLECTIVITY_BLEND], layerMaterial.metalness, material.metalness, blendingCoefficient, state );
    material.specular = BlendFieldViasRBG( blendOperators[SUBROUTINE_REFLECTIVITY_BLEND], layerMaterial.specular, material.specular, blendingCoefficient, state );
    material.specularSecondary = BlendFieldViasRBG( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTIVITY_BLEND], layerMaterial.specularSecondary, material.specularSecondary, blendingCoefficient, state );
    material.fresnel = BlendFieldViasRBG( blendOperators[SUBROUTINE_REFLECTIVITY_BLEND], layerMaterial.fresnel, material.fresnel, blendingCoefficient, state );
    material.fresnelSecondary = BlendFieldViasRBG( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTIVITY_BLEND], layerMaterial.fresnelSecondary, material.fresnelSecondary, blendingCoefficient, state );
   
    //transmission
    material.transmission = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.transmission, material.transmission, blendingCoefficient, state );
    material.refractionColor = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.refractionColor, material.refractionColor, blendingCoefficient, state );
    material.refractionDepth = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.refractionDepth, material.refractionDepth, blendingCoefficient, state );
    material.refractionGlossOrRoughness = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.refractionGlossOrRoughness, material.refractionGlossOrRoughness, blendingCoefficient, state );
    material.refractionF0 = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.refractionF0, material.refractionF0, blendingCoefficient, state );
    material.refractionThickness = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.refractionThickness, material.refractionThickness, blendingCoefficient, state );
    material.refractionSquash = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.refractionSquash, material.refractionSquash, blendingCoefficient, state );
    material.scatterColor = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.scatterColor, material.scatterColor, blendingCoefficient, state );
    material.scatterDepth = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.scatterDepth, material.scatterDepth, blendingCoefficient, state );
    material.scatterAniso = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.scatterAniso, material.scatterAniso, blendingCoefficient, state );
    material.scatterTranslucency = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.scatterTranslucency, material.scatterTranslucency, blendingCoefficient, state );
    material.fuzz = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.fuzz, material.fuzz, blendingCoefficient, state );
    material.thinTranslucency = BlendFieldViasRBG( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.thinTranslucency, material.thinTranslucency, blendingCoefficient, state );
    material.thinScatter = BlendField( blendOperators[SUBROUTINE_TRANSMISSION_BLEND], layerMaterial.thinScatter, material.thinScatter, blendingCoefficient, state );

    //diffusion
    material.sheen = BlendFieldViasRBG( blendOperators[SUBROUTINE_DIFFUSION_BLEND], layerMaterial.sheen, material.sheen, blendingCoefficient, state );
    material.sheenTint = BlendField( blendOperators[SUBROUTINE_DIFFUSION_BLEND], layerMaterial.sheenTint, material.sheenTint, blendingCoefficient, state );
    material.sheenGlossOrRoughnes = BlendField( blendOperators[SUBROUTINE_DIFFUSION_BLEND], layerMaterial.sheenGlossOrRoughnes, material.sheenGlossOrRoughnes, blendingCoefficient, state );

    //reflection
    material.anisoDirection = BlendVector( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.anisoDirection, material.anisoDirection, blendingCoefficient, state );
    material.anisoDirectionSecondary = BlendVector( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTION_BLEND], layerMaterial.anisoDirectionSecondary, material.anisoDirectionSecondary, blendingCoefficient, state );
    material.anisoAspect = BlendField( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.anisoAspect, material.anisoAspect, blendingCoefficient, state );
    material.anisoAspectSecondary = BlendField( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTION_BLEND], layerMaterial.anisoAspectSecondary, material.anisoAspectSecondary, blendingCoefficient, state );

    //emission
    material.emission = BlendFieldViasRBG( blendOperators[SUBROUTINE_EMISSION_BLEND], layerMaterial.emission, material.emission, blendingCoefficient, state );

    //displacement
    #ifdef DISPLACEMENT_VECTOR_OUTPUT
        material.displacement = BlendVector( blendOperators[SUBROUTINE_DISPLACEMENT_BLEND], layerMaterial.displacement, material.displacement, blendingCoefficient, state );
    #else
        material.displacement = BlendField( blendOperators[SUBROUTINE_DISPLACEMENT_BLEND], layerMaterial.displacement, material.displacement, blendingCoefficient, state );
    #endif

    // glints
    material.glintIntensity = BlendField( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.glintIntensity, material.glintIntensity, blendingCoefficient, state );
    material.glintGlossOrRoughness = BlendField( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.glintGlossOrRoughness, material.glintGlossOrRoughness, blendingCoefficient, state );
    material.glintDensity = BlendField( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.glintDensity, material.glintDensity, blendingCoefficient, state );
    material.glintScale = BlendField( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.glintScale, material.glintScale, blendingCoefficient, state );

    //newton's rings
    material.newtonsRingsThickness = BlendField( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTION_BLEND], layerMaterial.newtonsRingsThickness, material.newtonsRingsThickness, blendingCoefficient, state );
    material.newtonsRingsIntensity = BlendField( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTION_BLEND], layerMaterial.newtonsRingsIntensity, material.newtonsRingsIntensity, blendingCoefficient, state );

    //hair inputs
    material.hairAlbedo = BlendFieldViasRBG( blendOperators[SUBROUTINE_ALBEDO_BLEND], layerMaterial.hairAlbedo, material.hairAlbedo, blendingCoefficient, state );
    material.hairTint = BlendFieldViasRBG( blendOperators[SUBROUTINE_ALBEDO_BLEND], layerMaterial.hairTint, material.hairTint, blendingCoefficient, state );
    material.hairRadialRoughness = BlendField( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.hairRadialRoughness, material.hairRadialRoughness, blendingCoefficient, state );
    material.hairRadialRoughnessSecondary = BlendField( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTION_BLEND], layerMaterial.hairRadialRoughnessSecondary, material.hairRadialRoughnessSecondary, blendingCoefficient, state );
    material.hairDirection = normalize( BlendVector( blendOperators[SUBROUTINE_REFLECTION_BLEND], layerMaterial.hairDirection, material.hairDirection, blendingCoefficient, state ) );
    material.hairDirectionSecondary = normalize( BlendVector( blendOperators[SUBROUTINE_CLEARCOAT_REFLECTION_BLEND], layerMaterial.hairDirectionSecondary, material.hairDirectionSecondary, blendingCoefficient, state ) );
    
    //raster, painting & hybrid
    material.occlusion = BlendField( blendOperators[SUBROUTINE_OCCLUSION_BLEND], layerMaterial.occlusion, material.occlusion, blendingCoefficient, state );
    material.cavity = BlendField( blendOperators[SUBROUTINE_OCCLUSION_BLEND], layerMaterial.cavity, material.cavity, blendingCoefficient, state );
    material.cavityDiffuse = BlendField( blendOperators[SUBROUTINE_OCCLUSION_BLEND], layerMaterial.cavityDiffuse, material.cavityDiffuse, blendingCoefficient, state );
    material.cavitySpecular = BlendField( blendOperators[SUBROUTINE_OCCLUSION_BLEND], layerMaterial.cavitySpecular, material.cavitySpecular, blendingCoefficient, state );
}

#endif  // LAYERBLEND_FRAG
