#include "data/shader/mat/state.frag"
#include "data/shader/common/util.sh"

USE_TEXTURE_MATERIAL(tSheenMap);
uniform vec4		uSheenColor;

USE_TEXTURE_MATERIAL(tSheenRoughnessMap);
uniform vec4		uSheenRoughnessSwizzle;
uniform vec2		uSheenRoughnessScaleBias;
uniform uint		uSheenUseMicrosurface;

uniform uint		uSheenGrayscale;

void	SheenMap( inout FragmentState s )
{
	s.sheen = textureMaterial( tSheenMap, s.vertexTexCoord ).rgb;
	s.sheen = uSheenGrayscale ? s.sheen.rrr : s.sheen;
	s.sheen *= uSheenColor.rgb;

	float r = dot( textureMaterial( tSheenRoughnessMap, s.vertexTexCoord ), uSheenRoughnessSwizzle );
	s.sheenRoughness = uSheenRoughnessScaleBias.x * r + uSheenRoughnessScaleBias.y;
	s.sheenRoughness = uSheenUseMicrosurface ? saturate( 1.0 - s.gloss ) : s.sheenRoughness;

	//Disney BRDF style sheen tinting
	float lumAlbedo = luminance( s.albedo.rgb );
	vec3  sheenTint = lumAlbedo > 0.0 ? s.albedo.rgb * rcp(lumAlbedo) : vec3(1.0,1.0,1.0);
	s.sheen *= mix( vec3(1.0,1.0,1.0), saturate(sheenTint), uSheenColor.w );
}

#define Sheen	SheenMap
