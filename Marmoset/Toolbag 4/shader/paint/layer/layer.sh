#ifndef LAYER_SH
#define LAYER_SH

#include "layerblend.sh"
#include "layerformat.sh"
#include "layernoise.sh"
#include "layerinput.sh"

#define CHANNEL_NORMAL				1
#define CHANNEL_ALBEDO				2
#define CHANNEL_SPECULAR			3
#define CHANNEL_GLOSS				4
#define CHANNEL_ROUGHNESS			5
#define CHANNEL_METALNESS			6
#define CHANNEL_OCCLUSION			7
#define CHANNEL_CAVITY				8
#define CHANNEL_OPACITY				9
#define CHANNEL_DISPLACEMENT		10
#define CHANNEL_ALBEDO_METAL_DEPRECATED		11
#define CHANNEL_BUMP				12
#define CHANNEL_EMISSIVE			13
#define CHANNEL_SCATTER				14
#define CHANNEL_TRANSMISSION_MASK	15
#define CHANNEL_ANISO_DIR			16
#define CHANNEL_FUZZ				17
#define CHANNEL_SHEEN				18
#define CHANNEL_SHEEN_ROUGHNESS		19
#define CHANNEL_CUSTOM				20

#ifdef LAYER_BACKING
USE_TEXTURE2D(tLayerBacking);
#endif

#ifdef LAYER_MASK
USE_TEXTURE2D(tLayerMask);
#endif

uniform int		uChannel;
uniform vec2	uOutputSize;

uniform float	uLayerBlendOpacity;
uniform vec4	uLayerBackingColor;
uniform float	uLayerMaskValue;
uniform float	uLayerClipMasking;

uniform mat4	uTextureMatrix;
uniform mat4	uTextureMatrixInv;

uniform vec2	uLayerDitherSeed;

struct LayerState
{
	vec2	texCoord;		//sample coordinate
	vec2	pixelCoord;		//pixel coordinate on output buffer
	vec4	layerBacking;
	float	layerMask;
	vec4	result;
};

vec4	formatInputColor( vec4 color )
{
	// Convert all funky input pixel formats to RGBA. All math happens in RGBA.
	// A public interface for formatInputColor using uInputFormat.
	return formatInputColor( uInputFormat, color );  
}

LayerState  getLayerStateEmpty( vec2 texCoord )
{
	// build a LayerState struct out of shader inputs
	LayerState state;
	state.texCoord = texCoord;

	return state;
}

LayerState	getLayerState( vec2 texCoord )
{
	// build a LayerState struct out of shader inputs
	LayerState state;
	
	state.texCoord = texCoord;	
	state.pixelCoord = texCoord * uOutputSize;

	#ifdef LAYER_BACKING
	state.layerBacking = formatInputColor( texture2D( tLayerBacking, state.texCoord ) );
	#else
	state.layerBacking = formatInputColor( uLayerBackingColor );
	#endif

	//@@@ TODO: Consider alpha-testing with backing.alpha (hella savings probably)	

	#ifdef LAYER_MASK
	//interpret mask (always mono)
	state.layerMask = texture2D( tLayerMask, state.texCoord ).x;	
	#else
	state.layerMask = uLayerMaskValue;
	#endif

	//texture matrix
	state.texCoord = 
		col0(uTextureMatrix).xy * state.texCoord.x + 
		col1(uTextureMatrix).xy * state.texCoord.y + 
		col3(uTextureMatrix).xy;
	//default is pass-through
	state.result = state.layerBacking;
	
	return state;
}

vec4	compositeLayerStateNoDither( LayerState state )
{
	// interpret LayerState struct into one final fragment color, in the formatted output pixel format.
	
	vec4 color;
	color = blend( state.result, state.layerBacking, state.layerMask * uLayerBlendOpacity );
	color.a = mix( color.a, state.layerBacking.a, uLayerClipMasking ); //disables alpha write
	color = formatOutputColor( uOutputFormat, color );	

	return color;
}


vec4	compositeLayerState( LayerState state )
{
	vec4 color = blend( clamp(state.result, 0, 1.0f), state.layerBacking, state.layerMask * uLayerBlendOpacity );	
	color.a = mix( color.a, state.layerBacking.a, uLayerClipMasking ); //disables alpha write
	color = formatOutputColor( uOutputFormat, color );	

	#ifdef LAYER_OUTPUT_16BIT
	return color;
	#else
		#ifdef LAYER_OUTPUT_SRGB
		color.rgb = linearTosRGB( color.rgb );
		#endif

		color.rgb = layerDither8bit( color.rgb, state.pixelCoord.xy + uLayerDitherSeed );
	
		#ifdef LAYER_OUTPUT_SRGB
		color.rgb = sRGBToLinear(color.rgb);
		#endif
	#endif
	
	return color;

}


//@@@ TODO: switch over to separated samplers
/*
USE_SAMPLER(mySampler);
USE_TEXTURE2D_NOSAMPLER(myTex1);
USE_TEXTURE2D_NOSAMPLER(myTex2);
...
textureWithSampler( mytex, mysampler, ... )
textureWithSamplerLod( mytex, mysampler, ... )

ifdef CPR_METAL
	typedef texture2d<float> andresTexture;
elif defined(CPR_D3D11)
	typedef Texture2D andresTexture;
endif
*/


#endif
