#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(_p(tMicrosurfaceMap));

uniform vec4	_p(uMicrosurfaceSwizzle);
uniform vec2	_p(uMicrosurfaceScaleBias);
uniform float	_p(uMicrosurfaceExponent);
uniform float	_p(uMicrosurfaceHorizonSmooth);

void	MicrosurfaceAdvancedMap( inout FragmentState s )
{
	float g = dot( textureMaterial( _p(tMicrosurfaceMap), s.vertexTexCoord ), _p(uMicrosurfaceSwizzle) );
	g = pow( g, _p(uMicrosurfaceExponent) );
	_p(s.gloss) = _p(uMicrosurfaceScaleBias).x * g + _p(uMicrosurfaceScaleBias).y;

	float h = saturate( dot( s.normal, s.vertexEye ) );
	h = _p(uMicrosurfaceHorizonSmooth) - h * _p(uMicrosurfaceHorizonSmooth);
	_p(s.gloss) = mix( _p(s.gloss), 1.0, h*h );
}

#ifdef SUBROUTINE_SECONDARY
	#define	MicrosurfaceSecondary	MicrosurfaceAdvancedMapSecondary
#else
	#define	Microsurface			MicrosurfaceAdvancedMap
#endif
