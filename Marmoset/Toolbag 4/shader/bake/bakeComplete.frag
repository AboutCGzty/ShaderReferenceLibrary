//old shader, needs conversion to new bake system. -jdr

#include "traceRay.frag"
#include "utils.frag"
#include "dither.frag"

USE_TEXTURE2D(tAlbedoMap);
USE_TEXTURE2D(tSpecularMap);
USE_TEXTURE2D(tDiffuseLightMap);
USE_TEXTURE2D(tSpecularLightMap);

uniform float	uDitherScale;

BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec3,fTangent)
	INPUT2(vec3,fBitangent)
	INPUT3(vec3,fNormal)
	INPUT4(vec2,fTexCoord)
	INPUT5(vec3,fBakeDir)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0 = vec4(0.0, 0.0, 0.0, 0.0);

	vec3 traceDir = findTraceDirection( fPosition, normalize( fBakeDir ), fTexCoord );
	vec3 tracePos = findTraceOrigin( fPosition, traceDir, fTexCoord );

	TriangleHit hit;
	if( traceRay( tracePos, traceDir, hit ) )
	{
		float spec = texture2D( tSpecularMap, fTexCoord ).r;

		// Energy Conservation
		vec3 albedo = texture2D( tAlbedoMap, fTexCoord ).rgb;
		albedo -= albedo * spec;

		vec3 diffuseLight = texture2D( tDiffuseLightMap, fTexCoord ).rgb;
		vec3 specularLight = texture2D( tSpecularLightMap, fTexCoord ).rgb;

		vec3 final = specularLight + albedo * diffuseLight;


		if( uDitherScale > 0.0 )
		{ final = dither8bit( final, floor(IN_POSITION.xy * uDitherScale) ); }
		
		OUT_COLOR0.xyz = final;
		OUT_COLOR0.a = 1.0;
	}
}
