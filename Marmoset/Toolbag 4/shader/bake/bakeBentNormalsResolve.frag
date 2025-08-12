#include "hit.frag"
#include "dither.frag"

uniform vec4	uDstNormalMapParams;
uniform vec3	uDstNormalMapFlip;
uniform float	uDither;

void	BentNormalsPostIntersection( inout BakePostHit h )
{
	vec3 n;
	#ifdef BENT_NORMAL_WORLDSPACE
		n = h.dstNormal;
	#else
		n = vec3( 0.0, 0.0, 1.0 );
	#endif

	if( dot(h.hitData.xyz,h.hitData.xyz) > 0.0 )
	{ n = normalize( h.hitData.xyz ); }

	#ifdef BENT_NORMAL_WORLDSPACE
	
		vec3 worldNormal = n * uDstNormalMapFlip;
		worldNormal = 0.5*worldNormal + vec3( 0.5, 0.5, 0.5 );
		if( uDither > 0.0 )
		{ worldNormal = dither8bit( worldNormal, floor(vec2( h.dstPixelCoord ) * uDither) ); }
		h.output0.xyz = worldNormal;
	
	#else

		vec3 nt = n;
		vec3 T = h.dstTangent, B = h.dstBitangent, N = h.dstNormal;

		//ortho-normalization
		float renormalize = uDstNormalMapParams.x, orthogonalize = uDstNormalMapParams.y;
		N = mix( N, normalize( N ), renormalize );
		T -= (orthogonalize * dot( T, N ) ) * N;
		T = mix( T, normalize( T ), renormalize );
		B -= orthogonalize * (dot( B, N ) * N + dot(B,T) * T);
		B = mix( B, normalize( B ), renormalize );

		//regenerate bitangent
		vec3 B2 = cross( N, T );
		B2 = dot( B2, B ) < 0.0 ? -B2 : B2;
		B = mix( B, B2, uDstNormalMapParams.z );

		if( uDstNormalMapParams.w > 0.0 )
		{
			//fancier projection; some spaces need this
			vec3 row0 = cross( B, N );
			vec3 row1 = cross( N, T );
			vec3 row2 = cross( T, B );
			float sgn = dot( T, row0 ) < 0.0 ? -1.0 : 1.0;
			nt = normalize( sgn * vec3( dot(n, row0), dot(n, row1), dot(n, row2 ) ) );
		}
		else
		{
			//basic projection
			nt.x = dot( n, T );
			nt.y = dot( n, B );
			nt.z = dot( n, N );
		}

		nt *= uDstNormalMapFlip;
		nt = ( 0.5 * nt + vec3( 0.5, 0.5, 0.5 ) );
		if( uDither > 0.0 )
		{ nt = dither8bit( nt, floor( vec2( h.dstPixelCoord ) * uDither) ); }
		h.output0.xyz = nt;

	#endif
}

#define PostIntersection BentNormalsPostIntersection
