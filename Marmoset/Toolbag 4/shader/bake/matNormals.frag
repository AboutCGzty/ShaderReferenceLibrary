#ifndef MSET_MAT_NORMALS_FRAG
#define MSET_MAT_NORMALS_FRAG

USE_TEXTURE2D(tNormal);
USE_TEXTURE2D(tDetailNormal);
USE_TEXTURE2D(tDetailWeight);

uniform vec4	uNormalTexCoordScaleBias;

uniform vec3	uNormalMapScale; //typically 2,2,2
uniform	vec3	uNormalMapBias; //typically -1,-1,-1
uniform vec4	uNormalMapParams;
uniform int		uNormalMapObjectSpace;
uniform int		uNormalMapGenerateZ;

uniform float	uDetailWeight;
uniform vec4	uDetailTiling;	//xy-scale, zw-offset
uniform vec4	uDetailWeightSwizzle;

uniform vec3	uDetailNormalMapScale;	//typically 2,2,2
uniform	vec3	uDetailNormalMapBias;	//typically -1,-1,-1

vec3	sampleMaterialNormal( vec2 texcoord, vec3 tangent, vec3 bitangent, vec3 normal )
{	
	vec3 n = normal;
	vec3 T = tangent, B = bitangent, N = normal;

	//texture coords
	vec2 tc = uNormalTexCoordScaleBias.xy * texcoord + uNormalTexCoordScaleBias.zw;

	n = normalize( texture2DLod( tNormal, tc, 0.0 ).xyz * uNormalMapScale + uNormalMapBias );
	if( uNormalMapGenerateZ > 0 )
	{ n.z = sqrt( saturate( 1.0 - dot(n.xy,n.xy) ) ); }

	// Vertex Normal / Tangent / Bitangent
	float renormalize = uNormalMapParams.x, orthogonalize = uNormalMapParams.y;

	N = mix( N, normalize( N ), renormalize );
	T -= ( orthogonalize * dot( T, N ) ) * N;
	T = mix( T, normalize( T ), renormalize );
	vec3 orthB = orthogonalize * ( dot( B, N ) * N + dot( B, T ) * T );
	// don't subtract if it results in 0, which can't be normalized:
	float valueNonZero = float( any( greaterThan( abs( B - orthB ), vec3( 0.0, 0.0, 0.0 ) ) ) ) ;
	B -= orthB * valueNonZero;
	B = mix( B, normalize(B), renormalize );

	//regenerate bitangent
	vec3 B2 = cross( N, T );
	B2 = dot( B2, B ) < 0.0 ? -B2 : B2;
	B = mix( B, B2, uNormalMapParams.z );

	//detail normals
	{
		vec2 uv = tc;
		uv = uv * uDetailTiling.xy + uDetailTiling.zw;
		vec3 dn = texture2D( tDetailNormal, tc ).xyz; // At the moment detail normals don't support multiple UV sets when baking ~ ag
		dn = normalize( uDetailNormalMapScale * dn + uDetailNormalMapBias );
		float detailWeight = dot( texture2DLod( tDetailWeight, tc, 0.0 ), uDetailWeightSwizzle );
		detailWeight *= 0.5 * uDetailWeight;
		n = normalize( (n - vec3( 0.0, 0.0, 1.0 ) ) + (dn - vec3( 0.0, 0.0, 1.0 ) ) * detailWeight + vec3(0.0, 0.0, 1.0 ) );
	}

	if( uNormalMapObjectSpace < 1 )
	{
		n = n.x*T + n.y*B + n.z*N;
		n = normalize(n);
	}

	return n;
}

#endif
