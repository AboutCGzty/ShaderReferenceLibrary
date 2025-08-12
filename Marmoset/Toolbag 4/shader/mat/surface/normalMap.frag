#include "data/shader/mat/state.frag"
#include "data/shader/common/util.sh"

USE_TEXTURE_MATERIAL(tNormalMap);
#define tNormalMap_present

uniform vec3	uNormalMapScale; //typically 2,2,2
uniform	vec3	uNormalMapBias; //typically -1,-1,-1
uniform vec3	uNormalMapParams; //{ renormalize, orthoganalize, regenBitangent }
uniform mat4	uNormalMapObjectSpaceMatrix; //model to shading space transform
uniform int		uNormalMapObjectSpace;
uniform int		uNormalMapGenerateZ;

void	SurfaceNormalMap( inout FragmentState s )
{
	//sample and scale/bias the normal map
	vec4 nsamp = textureMaterial( tNormalMap, s.vertexTexCoord );
	vec3 n = uNormalMapScale*nsamp.xyz + uNormalMapBias;
	
	//regenerate z coordinate
	HINT_FLATTEN
	if( uNormalMapGenerateZ > 0 )
	{ n.z = sqrt( saturate( 1.0 - dot(n.xy,n.xy) ) ); }

	//ortho-normalization
	vec3 T = s.vertexTangent;
	vec3 B = s.vertexBitangent;
	vec3 N = s.vertexNormal;

	float renormalize = uNormalMapParams.x, orthogonalize = uNormalMapParams.y;
	N = mix( N, normalize(N), renormalize );
	T -= (orthogonalize * dot(T,N)) * N;
	T = mix( T, normalize(T), renormalize );
	vec3 orthB = orthogonalize * (dot(B,N)*N + dot(B,T)*T);
		// don't subtract if it results in 0, which can't be normalized:
		float valueNonZero = float(any(greaterThan( abs(B - orthB), vec3(0.0,0.0,0.0) )));
		B -= orthB * valueNonZero;
	B = mix( B, normalize(B), renormalize );

	//regenerate bitangent
	vec3 B2 = cross( N, T );
	B2 = dot(B2,B) < 0.0 ? -B2 : B2;
	B = mix( B, B2, uNormalMapParams.z );
	
	// object/tangent space switch
	HINT_FLATTEN
	if( uNormalMapObjectSpace > 0 )
	{ n = mulVec( uNormalMapObjectSpaceMatrix, n ); }
	else
	{ n = n.x*T + n.y*B + n.z*N; }

	//store our results
	s.normal = normalize( n );
	s.vertexTangent = T;
	s.vertexBitangent = B;
	s.vertexNormal = N;
	s.albedo.a = nsamp.a;
}

#define	Surface	SurfaceNormalMap
