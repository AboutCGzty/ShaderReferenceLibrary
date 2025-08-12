//inherits alphaBase.frag

#include "data/shader/common/rng.comp"

uniform uint uDitherSeed;

void	TransparencyDitherRNG( inout FragmentState s )
{
#ifndef TransparencyDitherNoAlphaBase
	AlphaBase(s);
#endif

	RNG rng = rngInit( (s.screenCoord.x<<16) | s.screenCoord.y, uDitherSeed ^ asuint(s.screenDepth) );
	float noise = rngNextFloat( rng );
	if( s.albedo.a <= noise )
	{
		discard;
	}
}

#define	Transparency	TransparencyDitherRNG
#define TransparencyHasAlpha
