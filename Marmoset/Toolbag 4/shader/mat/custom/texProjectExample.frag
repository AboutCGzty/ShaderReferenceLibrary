#include "../State.frag"

USE_TEXTURE2D(tCustomMapA);//projectmap "albedo"
USE_TEXTURE2D(tCustomMapB);//projectmap "roughness"
USE_TEXTURE2D(tCustomMapC);//projectmap "normal"
USE_TEXTURE2D(tCustomMapD);//projectmap "custom"

void customAlbedo(inout FragmentState s)
{
	vec3 A = texture2D( tCustomMapA, s.vertexTexCoord ).rgb;
	vec3 B = texture2D( tCustomMapB, s.vertexTexCoord ).rrr;
	vec3 C = texture2D( tCustomMapC, s.vertexTexCoord ).rgb;
	vec3 D = texture2D( tCustomMapD, s.vertexTexCoord ).rgb;

	float diagonal = s.screenTexCoord.x + 0.5*(s.screenTexCoord.y - 0.5);

	if( diagonal < 0.25 )
	{ s.albedo.rgb = A; }

	else if( diagonal < 0.50 ) 
	{ s.albedo.rgb = B; }

	else if( diagonal < 0.75 ) 
	{ s.albedo.rgb = C; }

	else
	{ s.albedo.rgb = D; }
}

#ifdef Albedo
	#undef Albedo
#endif
#define Albedo customAlbedo
