//inherits "normalMap.frag"

USE_TEXTURE_MATERIAL(tDetailNormalMap);
USE_TEXTURE_MATERIAL(tDetailWeightMap);

uniform float	uDetailWeight;
uniform vec4	uDetailTiling;	//xy-scale, zw-offset
uniform vec4	uDetailWeightSwizzle;
uniform float	uDetailUseSecondaryUV;	//0.0 - use primary uv, 1.0 - use secondary

uniform vec3	uDetailNormalMapScale;	//typically 2,2,2
uniform	vec3	uDetailNormalMapBias;	//typically -1,-1,-1

void	SurfaceDetailNormalMap( inout FragmentState s )
{
	SurfaceNormalMap(s);
	
	//look up detail normal
	vec2 uv = lerp( s.vertexTexCoord.xy, s.vertexTexCoordSecondary.xy, uDetailUseSecondaryUV );
	uv = uv*uDetailTiling.xy + uDetailTiling.zw;
	vec3 dn = textureMaterial( tDetailNormalMap, uv ).xyz;
	dn = uDetailNormalMapScale*dn + uDetailNormalMapBias;

	//ortho-normalization of new tangent basis
	vec3 T = s.vertexTangent;
	vec3 B = s.vertexBitangent;
	vec3 N = s.normal;
	T -= dot(T,N)*N;
	T = normalize(T);
	B -= dot(B,N)*N + dot(B,T)*T;
	B = normalize(B);
	
	//blend in the detail normal
	dn =	dn.x * T +
			dn.y * B +
			dn.z * N;
	float detailWeight = dot( textureMaterial( tDetailWeightMap, s.vertexTexCoord ), uDetailWeightSwizzle );
	detailWeight *= uDetailWeight;
	s.normal = normalize( s.normal + dn * detailWeight );
}

#undef Surface
#define	Surface	SurfaceDetailNormalMap
