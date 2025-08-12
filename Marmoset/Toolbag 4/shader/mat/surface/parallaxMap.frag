//inherits "normalMap.frag"

#if !defined(MATERIAL_PASS_EXPORT)

USE_TEXTURE2D(tParallaxHeightMap);

uniform vec4	uParallaxSwizzle;
uniform vec2	uParallaxDepthOffset;

float	ParallaxSample( vec2 c )
{
	return 1.0 - dot( texture2DLod( tParallaxHeightMap, c, 0.0 ), uParallaxSwizzle );
}

void	SurfaceParallaxMap( inout FragmentState s )
{
	#ifdef MATERIAL_PASS_PAINT
		s.displacement = dot( texture2D( tParallaxHeightMap, s.vertexTexCoord ), uParallaxSwizzle );
		//NOTE: It is possible for parallax to override Height Map displacement value.
		// Addition will not work if the default displacement value is 0.5 --Andres

	#else
		vec3 dir =	vec3(	dot( -s.vertexEye, s.vertexTangent ),
							dot( -s.vertexEye, s.vertexBitangent ),
							dot( -s.vertexEye, s.vertexNormal )	);
		vec2 maxOffset = dir.xy * (uParallaxDepthOffset.x / (abs(dir.z) + 0.001));
	
		float minSamples = 16.0;
		float maxSamples = 128.0;
		float samples = saturate( 3.0*length(maxOffset) );
		float incr = rcp( mix( minSamples, maxSamples, samples ) );

		vec2 tc0 = s.vertexTexCoord - uParallaxDepthOffset.y*maxOffset;
		float h0 = ParallaxSample( tc0 );
		HINT_LOOP
		for( float i=incr; i<=1.0; i+=incr )
		{
			vec2 tc = tc0 + maxOffset * i;
			float h1 = ParallaxSample( tc );
			if( i >= h1 )
			{
				//hit! now interpolate
				float r1 = i, r0 = i-incr;
				float t = (h0-r0)/((h0-r0)+(-h1+r1));
				float r = (r0-t*r0) + t*r1;
				s.vertexTexCoord = tc0 + r*maxOffset;
				break;
			}
			else
			{
				s.vertexTexCoord = tc0 + maxOffset;
			}
			h0 = h1;
		}
	#endif

	//standard normal mapping
	SurfaceNormalMap(s);
}

#undef  Surface
#define	Surface	SurfaceParallaxMap

#endif