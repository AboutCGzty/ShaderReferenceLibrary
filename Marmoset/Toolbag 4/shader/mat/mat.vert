#include "../common/util.sh"
#include "state.vert"

uniform mat4	uModelLightMatrix;
uniform mat4	uModelInverseTransposeLightMatrix;
uniform mat4	uModelViewProjectionMatrix;

uniform vec4	uTexCoordScaleBias;

vec3	decodeUnitVector( vec3 v )
{
	return (2.0*(1023.0/1022.0))*v - vec3(1.0,1.0,1.0);
}

BEGIN_PARAMS
	#ifdef VERT_NOATTRIBS
		#define vPosition	vec3(0.0,0.0,0.0)
		#define vColor		vec4(1.0,1.0,1.0,1.0)
		#define vTangent	vec3(1.0,0.0,0.0)
		#define vBitangent	vec3(0.0,1.0,0.0)
		#define vNormal		vec3(0.0,0.0,1.0)
		#define vTexCoord0	vec2(0.0,0.0)
		#define vTexCoord1	vec2(0.0,0.0)
		#define decodeUnitVector(x)	(x)
		INPUT_VERTEXID(vID)
	#else
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)
	#endif

	#ifdef VERT_INSTANCING
		INPUT_INSTANCEID(vInstanceID)
	#endif

	OUTPUT0(vec3,fPosition)
	OUTPUT1(vec4,fColor)
	OUTPUT2(vec3,fTangent)
	OUTPUT3(vec3,fBitangent)
	OUTPUT4(vec3,fNormal)
	OUTPUT5(vec4,fTexCoord)
	#ifdef VERT_INSTANCING
		OUTPUT6(int2,fInstanceID)
	#endif
END_PARAMS
{
	VertexState s;
	s.rasterPosition.w = 1.0;
	s.rasterPosition.xyz =
	s.position = vPosition;
	s.tangent = decodeUnitVector( vTangent );
	s.bitangent = decodeUnitVector( vBitangent );
	s.normal = decodeUnitVector( vNormal );
	s.color = vColor;
	s.texCoord.xy = vTexCoord0;
	s.texCoord.zw = vTexCoord1;	
	s.texCoordScaleBias = uTexCoordScaleBias;

	#ifdef VERT_INSTANCING
		s.instanceID = vInstanceID;
	#else
		s.instanceID = 0;
	#endif

	#ifdef VERT_NOATTRIBS
		s.vertexID = vID;
	#else
		s.vertexID = 0;
	#endif

	#ifdef Premerge
		Premerge(s);
	#endif
	s.texCoord.xy = s.texCoord.xy * s.texCoordScaleBias.xy + s.texCoordScaleBias.zw;
	s.rasterPosition = mulPoint( uModelViewProjectionMatrix, s.position );
	s.position = mulPoint( uModelLightMatrix, s.position ).xyz;
	s.tangent = normalize( mulVec( uModelInverseTransposeLightMatrix, s.tangent ) );
	s.bitangent = normalize( mulVec( uModelInverseTransposeLightMatrix, s.bitangent ) );
	s.normal = normalize( mulVec( uModelInverseTransposeLightMatrix, s.normal ) );
	
	#ifdef Merge
		Merge(s);
	#endif
	
	OUT_POSITION = s.rasterPosition;
	fPosition = s.position;
	fTangent = s.tangent;
	fBitangent = s.bitangent;
	fNormal = s.normal;
	fColor = s.color;
	fTexCoord = s.texCoord;
	#ifdef VERT_INSTANCING
		fInstanceID = int2(s.instanceID,s.instanceID);
	#endif
}
