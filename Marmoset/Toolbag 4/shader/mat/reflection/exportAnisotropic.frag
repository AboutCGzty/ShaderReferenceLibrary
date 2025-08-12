#include "data/shader/mat/state.frag"
#include "data/shader/mat/reflection/anisoParams.frag"

void	ReflectionAniso( inout FragmentState s )
{
	vec3 tangent, bitangent;
	_p(anisoGetBasis)( s, tangent, bitangent );
	s.generic3.rgb = tangent;
}

#define	Reflection	ReflectionAniso