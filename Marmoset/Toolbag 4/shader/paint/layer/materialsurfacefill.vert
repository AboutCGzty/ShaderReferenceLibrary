#include "../../common/util.sh"

uniform vec4	uViewportScaleBias;

#ifdef EFFECT_POSITIONAL
	uniform mat4	uModelView;
	uniform mat4	uModelViewIT;

	vec3	decodeUnitVector( vec3 v )
	{
		return (2.0*(1023.0/1022.0))*v - vec3(1.0,1.0,1.0);
	}
	BEGIN_PARAMS
		INPUT0(vec3,vPosition)
		INPUT1(vec3,vTangent)
		INPUT2(vec3,vBitangent)
		INPUT3(vec3,vNormal)
		INPUT4(vec2,vTexCoord0)
		INPUT5(vec2,vTexCoord1)
		INPUT6(vec4,vColor)

		OUTPUT0(vec2,fBufferCoord)
		OUTPUT1(vec3,fPosition)
		OUTPUT3(vec3,fNormal)
		OUTPUT4(vec3,fTangent)
		OUTPUT5(vec3,fBitangent)
	END_PARAMS
	{
		vec4 scaleBias = uViewportScaleBias;
		vec2 pos = vTexCoord0;
		pos = 2.0 * pos - vec2(1.0,1.0);
		#ifdef RENDERTARGET_Y_DOWN
			pos.y = -pos.y;
			scaleBias.w = -scaleBias.w;
		#endif
		pos = (pos * scaleBias.xy) + scaleBias.zw;

		OUT_POSITION.xy = pos;
		OUT_POSITION.zw = vec2( 0.5, 1.0 );

		fPosition = vPosition;		
		fPosition = mulPoint( uModelView, fPosition ).xyz;	

		fNormal = normalize( mulVec( uModelViewIT, decodeUnitVector(vNormal) ) );	
		fTangent = normalize( mulVec( uModelViewIT, decodeUnitVector(vTangent) ) );
		fBitangent = normalize( mulVec( uModelViewIT, decodeUnitVector(vBitangent) ) );
		
		vec3 uv = vec3(vTexCoord0.x, vTexCoord0.y, 0.0);
		fBufferCoord = uv.xy;
	}
#else
	BEGIN_PARAMS
		INPUT_VERTEXID(vertID)
		OUTPUT0(vec2, fBufferCoord)
	END_PARAMS
	{		
		//flip raster position so that all rendered results are upside down
		vec4 scaleBias = uViewportScaleBias;
		#ifdef RENDERTARGET_Y_DOWN
			vec2 pos = vec2(
				vertID == 2 ? 3.0 : -1.0,
				vertID == 1 ? -3.0 : 1.0 );					
				scaleBias.w = -scaleBias.w;
		#else
			vec2 pos = vec2(
				vertID == 1 ? 3.0 : -1.0,
				vertID == 2 ? 3.0 : -1.0 );						
		#endif
		
		fBufferCoord.xy = abs(pos) - vec2(1.0, 1.0);
		pos = (pos * scaleBias.xy) + scaleBias.zw;

		OUT_POSITION.xy = pos;
		OUT_POSITION.zw = vec2( 0.5, 1.0 );
	}
#endif
