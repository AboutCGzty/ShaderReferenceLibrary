#include "../../common/util.sh"

vec3	decodeUnitVector( vec3 v )
{
	return (2.0*(1023.0/1022.0))*v - vec3(1.0,1.0,1.0);
}

#ifdef GEO_PASS
	BEGIN_PARAMS
		INPUT0(vec3,vPosition)
		INPUT1(vec3,vTangent)
		INPUT2(vec3,vBitangent)
		INPUT3(vec3,vNormal)
		INPUT4(vec2,vTexCoord0)
		INPUT5(vec2,vTexCoord1)
		INPUT6(vec4,vColor)

		OUTPUT0(vec2,fTexCoord)
	END_PARAMS
	{
		vec2 pos = 2.0 * vTexCoord0 - vec2(1.0,1.0);
		#ifdef RENDERTARGET_Y_DOWN
			pos.y = -pos.y;
		#endif
		OUT_POSITION.xy = pos;
		OUT_POSITION.zw = vec2( 0.5, 1.0 );	
		fTexCoord = vTexCoord0.xy;
	}
#else
	BEGIN_PARAMS
		INPUT_VERTEXID(vertID)
		OUTPUT0( vec2, fTexCoord )
	END_PARAMS
	{
		#ifdef RENDERTARGET_Y_DOWN
			vec2 pos = vec2(
				vertID == 2 ? 3.0 : -1.0,
				vertID == 1 ? -3.0 : 1.0 );
			OUT_POSITION.xy = pos;
			OUT_POSITION.zw = vec2( 0.5, 1.0 );
			fTexCoord.xy = abs(pos) - vec2(1.0, 1.0);
		#else
			vec2 pos = vec2(
				vertID == 1 ? 3.0 : -1.0,
				vertID == 2 ? 3.0 : -1.0 );
			OUT_POSITION.xy = pos;
			OUT_POSITION.zw = vec2( 0.5, 1.0 );
			fTexCoord.xy = abs(pos) - vec2(1.0, 1.0);
		#endif
	}
#endif

