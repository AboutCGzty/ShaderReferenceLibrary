#include "data/shader/mat/state.frag"
#include "../../common/util.sh"

USE_TEXTURE2D(tDisplacementHeightMap);

uniform vec2	uDisplacementScaleBias;
uniform vec4	uDisplacementSwizzle;

void	DisplacementHeight( inout FragmentState s )
{
	s.displacement = dot( texture2D( tDisplacementHeightMap, s.vertexTexCoord ), uDisplacementSwizzle );
	//NOTE: It is possible for parallax to come in and override this displacement value with its heightmap later on.
	// Addition will not work if the default displacement value is 0.5 --Andres
}

#define	Displacement	DisplacementHeight
