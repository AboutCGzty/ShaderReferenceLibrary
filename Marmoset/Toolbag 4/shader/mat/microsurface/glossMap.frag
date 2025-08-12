#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(_p(tGlossMap));

uniform vec4	_p(uGlossSwizzle);
uniform vec2	_p(uGlossScaleBias);

void	MicrosurfaceGlossMap( inout FragmentState s )
{
	float g = dot( textureMaterial( _p(tGlossMap), s.vertexTexCoord ), _p(uGlossSwizzle) );
	_p(s.gloss) = _p(uGlossScaleBias).x * g + _p(uGlossScaleBias).y;
}

#ifdef SUBROUTINE_SECONDARY
	#define	MicrosurfaceSecondary	MicrosurfaceGlossMapSecondary
#else
	#define	Microsurface			MicrosurfaceGlossMap
#endif
