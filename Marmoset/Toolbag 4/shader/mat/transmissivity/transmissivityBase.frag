#include "data/shader/mat/state.frag"

USE_TEXTURE_MATERIAL(tTransmissivityMap);
uniform vec2	uTransmissivityScaleBias;
uniform vec4	uTransmissivitySwizzle;
uniform uint	uTransmissivityUseAlbedoAlpha;

float TransmissivityBase( inout FragmentState s )
{
	float t = s.albedo.a;
	if( !uTransmissivityUseAlbedoAlpha )
	{
		t = dot( textureMaterial( tTransmissivityMap, s.vertexTexCoord ), uTransmissivitySwizzle );
		t = uTransmissivityScaleBias.x * t + uTransmissivityScaleBias.y;
	}
	return saturate( t );
}
