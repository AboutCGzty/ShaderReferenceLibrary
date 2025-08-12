//inherits alphaBase.frag

uniform float	uAlphaDitherOffset;

void	TransparencyDither( inout FragmentState s )
{
#ifndef TransparencyDitherNoAlphaBase
	AlphaBase(s);
#endif

#if !defined(MATERIAL_PASS_PAINT) && !defined(MATERIAL_PASS_EXPORT)
	float noise;
	{
		vec2 seed = vec2(s.screenCoord) + 32.0 * s.vertexTexCoord;
		noise = fract( cos( dot(seed, vec2( 23.14069263277926, 2.665144142690225 ) ) ) * 12345.6789 );
		noise = fract( noise + uAlphaDitherOffset );
	}

	HINT_FLATTEN
	if( s.albedo.a < noise )
	{
		discard;
	}
#endif
}

#define	Transparency	TransparencyDither
#define TransparencyHasAlpha
