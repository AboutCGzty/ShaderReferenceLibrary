#include "layer.sh"
#include "layerprojector.sh"
#include "materialsurface.frag"

#ifdef PAINT_COMPOSITE
#include "materialcomposite.frag"
#endif

USE_TEXTURE2D(tFillTexture);
uniform vec4	uFillSwizzle;
uniform uint	uFillGrayScale;

//normals need to be multiplied by the inverse of the texture matrix after texture sampling
vec4 formatNormalTap( vec4 tap )
{
	vec3 n = tap.xyz * 2.0 - vec3(1.0,1.0,1.0);
	n = normalize(
		col0(uTextureMatrixInv).xyz * n.x +
		col1(uTextureMatrixInv).xyz * n.y +
		col2(uTextureMatrixInv).xyz * n.z );
	tap.xyz = n*0.5 + vec3(0.5,0.5,0.5);
	return tap;
}

BEGIN_PARAMS
	INPUT0( vec2, fBufferCoord )
#ifdef EFFECT_POSITIONAL	
	INPUT1( vec3, fPosition )
	INPUT3( vec3, fNormal )
	INPUT4( vec3, fTangent )
	INPUT5( vec3, fBitangent )	
#endif
	OUTPUT_COLOR0( vec4 )
END_PARAMS
{
	vec2 surfaceCoord = fBufferCoord;
	#ifdef PAINT_COMPOSITE
		
		vec4 stroke = paintStrokeCull(surfaceCoord);
		vec2 dUVx = dFdx(surfaceCoord);
		vec2 dUVy = dFdy(surfaceCoord);
	#endif
		
	LayerState state = getLayerState( surfaceCoord );

	vec2 fillCoord = state.texCoord;
	
	vec4 tex = texture2D( tFillTexture, fillCoord );	
	tex = uFillGrayScale ? tex.rrra : tex;
	state.result = tex;
	
	#ifndef LAYER_OUTPUT
		#define	LAYER_OUTPUT 0
	#endif

	#ifdef EFFECT_POSITIONAL
		#if defined(EFFECT_TRIPLANAR)
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( surfaceCoord );
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal, inputNormal );	
			#else
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			vec4 tap_x = texture2D( tFillTexture, p.uvX );
			vec4 tap_y = texture2D( tFillTexture, p.uvY );
			vec4 tap_z = texture2D( tFillTexture, p.uvZ );
			state.result = triplanarMix( p, tap_x, tap_y, tap_z );
		
		#elif defined(EFFECT_PLANAR)
			#if defined(INPUT_NORMAL)
				vec3 iNormal = sampleInputNormal( surfaceCoord );
				PlanarSampler p = getPlanarSampler( fPosition, fTangent, fBitangent, fNormal, iNormal );	
			#else
				PlanarSampler p = getPlanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			state.result = texture2D( tFillTexture, p.uv );
			state.result = planarMix( p, state.result );
		#endif
	#endif
	
	state.result = materialSurfaceAdjust( state.result );

	#if LAYER_OUTPUT == CHANNEL_NORMAL
		state.result = formatNormalTap( state.result );			
	#endif
	
	#ifdef PAINT_COMPOSITE
		//dithering happens inside paintStrokeComposite
		vec4 result = compositeLayerStateNoDither( state );
		paintStrokeComposite(stroke, fBufferCoord, dUVx, dUVy, result);
		OUT_COLOR0 = result;
	#else
		OUT_COLOR0 = compositeLayerState( state );
	#endif

}
