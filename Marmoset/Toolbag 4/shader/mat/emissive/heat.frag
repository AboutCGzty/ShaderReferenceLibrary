#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tEmissiveHeatMap);
USE_TEXTURE2D(tEmissiveHeatSpectrum);

uniform vec3	uEmissiveHeatRange; // { min temp, max temp, brightness }

void	EmssiveHeat( inout FragmentState s )
{
	float temp = mix( uEmissiveHeatRange.x, uEmissiveHeatRange.y, textureMaterial( tEmissiveHeatMap, s.vertexTexCoord ).x );
	float mireds = 1000.0 / temp; //actually mireds divided by 1000

	float intensity = saturate( temp/ 10000.0 );
	intensity *= intensity;
	intensity *= uEmissiveHeatRange.z;

	s.emissiveLight += intensity * texture2D( tEmissiveHeatSpectrum, vec2(mireds,0.0) ).xyz;
}

#define	Emissive	EmssiveHeat