#include "gaussian.sh"
#include "layernoise.sh"
#include "effectperlinbase.frag"
#include "effectwarpcoords.frag"

#ifndef PREPASS
	#include "layer.sh"
	#include "layerprojector.sh"
#endif

uniform float	uContrast;
uniform float	uScale;
uniform vec4	uColorA;
uniform vec4	uColorB;


vec4 getCheckerBoard(vec2 uv)
{
	int cb = floor(uv.x)+floor(uv.y);
	float h = cb;
	h *= 0.5;
	if( h != floor(h) )
	{ return uColorA; }
	return uColorB;
}

vec4 getCheckerBoard3D(vec3 pos)
{
	int cb = floor(pos.x)+floor(pos.y)+floor(pos.z);
	float h = cb;
	h *= 0.5;
	if( h != floor(h) )
	{ return uColorA; }
	return uColorB;
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
	vec2 sampleCoord = fBufferCoord;

	LayerState state = getLayerState( sampleCoord );

	vec4 outputColor = vec4(0.0,0.0,0.0,0.0);

	#ifdef EFFECT_POSITIONAL
		#ifdef EFFECT_TRIPLANAR
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( sampleCoord );				
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal, inputNormal );	
			#else
				TriplanarSampler p = getTriplanarSampler( fPosition, fTangent, fBitangent, fNormal );	
			#endif
			vec4 vx = getCheckerBoard( applyWarp(p.uvX, uScale) * uScale );
			vec4 vy = getCheckerBoard( applyWarp(p.uvY, uScale) * uScale );
			vec4 vz = getCheckerBoard( applyWarp(p.uvZ, uScale) * uScale );
			outputColor = triplanarMix( p, vx, vy, vz );
		#else
			outputColor = getCheckerBoard3D(applyWarp3D(fPosition, uScale) * uScale);
		#endif
	#else
		outputColor = getCheckerBoard(applyTiledWarp(state.texCoord.xy, state.texCoord.xy, vec2(0, 0), uScale) * uScale);
	#endif

	outputColor = lerp( vec4(0.5,0.5,0.5,1.0), outputColor, uContrast );		//amount is noise contrast, i.e. lerp between flat gray and noise

	state.result = outputColor;
	OUT_COLOR0 = compositeLayerStateNoDither( state );		
}

