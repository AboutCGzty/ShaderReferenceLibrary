uniform vec3	uMediumExtinction;
uniform float	uMediumScatter;
uniform float	uMediumAnisotropy;

void MediumHomogenous( inout FragmentState s )
{
	s.mediumExtinction	= uMediumExtinction;
	s.mediumScatter		= vec3( uMediumScatter, uMediumScatter, uMediumScatter );
	s.mediumAnisotropy	= uMediumAnisotropy;
}

#define Medium	MediumHomogenous
