//inherits occlusionMap.frag

#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tCurvatureTexture);
uniform vec4	uCurvatureSwizzle;
uniform float	uCurvatureStrength;
uniform int		uCurvatureGrayscale;

void	OcclusionMapAdv( inout FragmentState s )
{
	#ifdef Occlusion
		Occlusion(s);
	#endif

	vec4 samp = textureMaterial( tCurvatureTexture, s.vertexTexCoord );
	if( uCurvatureGrayscale )
	{
		float c = dot( samp, uCurvatureSwizzle );
		s.curvature = 2.0 * c - 1.0;
	}
	else
	{
		s.curvature = samp.y - samp.x;
	}
	s.curvature *= uCurvatureStrength;
}
#ifdef Occlusion
	#undef Occlusion
#endif
#define	Occlusion	OcclusionMapAdv
