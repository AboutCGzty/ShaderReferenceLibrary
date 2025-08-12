#include "hit.frag"
#include "dither.frag"

USE_TEXTURE2D(tNormals);

uniform vec2	uScaleBias;
uniform float	uStrength;
uniform uint	uDither;
uniform float	uHandedness;
uniform vec2	uKernelSize;

BEGIN_PARAMS
	INPUT1(vec2,fTexCoord)
	INPUT2(vec3,fTangent)
	INPUT3(vec3,fBitangent)
	INPUT4(vec3,fNormal)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0 = vec4(0.0, 0.0, 0.0, 0.0);

	vec2 coord = fTexCoord;
	#ifndef RENDERTARGET_Y_DOWN
		coord.y = 1.0 - coord.y;
	#endif
	
	vec3 n;
	{
		vec4 nsamp = texture2DLod( tNormals, coord, 0.0 );
		if( nsamp.a <= 0.0 )
		{ return; }
		n = normalize( 2.0*nsamp.xyz - vec3(1.0,1.0,1.0) );
	}
	
	float flip = uHandedness;
	if( dot( n, fNormal ) < 0.0 )
	{
		flip = -flip;
	}
	vec3 t = normalize( fTangent - n * dot( fTangent, n ) );
	vec3 b = flip * normalize( fBitangent - n * dot( fBitangent, n ) );

	vec3 positions[4];
	positions[0] = t;
	positions[1] = b;
	positions[2] = normalize( t + b );
	positions[3] = normalize( t - b );

	vec2 offsets[4];
	offsets[0] = vec2( uKernelSize.x, 0             );
	offsets[1] = vec2( 0,             uKernelSize.y );
	offsets[2] = vec2( uKernelSize.x, uKernelSize.y );
	offsets[3] = vec2( uKernelSize.x,-uKernelSize.y );

	float c = 0.0;
	float sampleCount = 0.0;

	HINT_UNROLL
	for( int i = 0; i < 4; ++ i )
	{
		HINT_UNROLL
		for( int j = 0; j < 2; ++j )
		{
			vec2 o = (j==0) ? offsets[i] : -offsets[i];
			vec3 p = (j==0) ? positions[i] : -positions[i];

			vec2 s = saturate(coord + o);

			vec4 v = texture2DLod( tNormals, s, 0.0 );
			HINT_BRANCH
			if( v.a > 0.0 )
			{
				v.xyz /= v.a;
				vec3 neighbor = normalize( 2.0 * v.xyz - vec3( 1.0, 1.0, 1.0 ) );
				c += dot( neighbor, p );
				sampleCount += 1.0;
			}
		}
	}

	if( sampleCount > 0.0 )
	{ c /= sampleCount; }

	c *= uStrength;
	c = saturate( uScaleBias.x * c + uScaleBias.y );
	
	if( uDither )
	{
		c = dither8bit( vec3(c,c,c), IN_POSITION.xy ).x;
	}
	
	OUT_COLOR0 = vec4(c, 1.0, 1.0, 1.0);
}

#define PostIntersection	CurvaturePostIntersection
