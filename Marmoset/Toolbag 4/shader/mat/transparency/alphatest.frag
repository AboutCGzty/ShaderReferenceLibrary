//inherits alphaBase.frag

uniform	float	uAlphaTestValue;

void	TransparencyAlphaTest( inout FragmentState s )
{
	AlphaBase(s);

	HINT_FLATTEN
	if( s.albedo.a < uAlphaTestValue )
	{
		discard;
	}
}

#define	Transparency	TransparencyAlphaTest
