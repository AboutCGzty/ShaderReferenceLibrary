USE_TEXTURE2D(tInput);

uniform vec2	uPixelSize;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec4 r = texture2DLod( tInput, fCoord, 0.0 );

	//new 'average-of-neighbors' method
	HINT_BRANCH if( r.a <= 0.0 )
	{
		r.a = 0.0;
		float weight = 0.0;
		vec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );

		#define SAMPLE(i,j,w) {\
			vec2 off = vec2( float(i), float(j) );\
			vec4 s = texture2DLod( tInput, fCoord + uPixelSize * off, 0.0 );\
			if( s.a > 0.0 )\
			{ sum += w*s; weight += w; }\
		}

		SAMPLE(-1, 0, 1.0);
		SAMPLE( 1, 0, 1.0);
		SAMPLE( 0,-1, 1.0);
		SAMPLE( 0, 1, 1.0);

		SAMPLE(-1,-1, 0.7071);
		SAMPLE(-1, 1, 0.7071);
		SAMPLE( 1,-1, 0.7071);
		SAMPLE( 1, 1, 0.7071);

		if( weight >= 1.0 )
		{
			r = sum / weight;
		}
	}
	
	OUT_COLOR0 = r;
}