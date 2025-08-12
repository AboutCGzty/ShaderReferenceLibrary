#ifndef SAMPLE_COUNT
	#define	SAMPLE_COUNT 4
#endif

USE_TEXTURE2D(tInput);

uniform vec2	uInputRes;

vec4	combine( vec4 s0, vec4 s1, vec4 s2, vec4 s3 )
{
	//weighted alpha combine
	vec4 a = vec4( s0.a, s1.a, s2.a, s3.a );
	#ifdef RESOLVE_ALPHASATURATE
		//treat all nonzero alphas as 1.0
		a.x = a.x > 0.0 ? 1.0 : 0.0;
		a.y = a.y > 0.0 ? 1.0 : 0.0;
		a.z = a.z > 0.0 ? 1.0 : 0.0;
		a.w = a.w > 0.0 ? 1.0 : 0.0;
	#elif defined(RESOLVE_ALPHAIGNOREZERO)
		//final alpha is average of all nonzero alphas
		float alphaCount;
		alphaCount =  a.x > 0.0 ? 1.0 : 0.0;
		alphaCount += a.y > 0.0 ? 1.0 : 0.0;
		alphaCount += a.z > 0.0 ? 1.0 : 0.0;
		alphaCount += a.w > 0.0 ? 1.0 : 0.0;
	#endif
	float w = (a.x + a.y) + (a.z + a.w);
	a = w > 0.0 ? a*rcp(w) : vec4(0.25,0.25,0.25,0.25);
	
	vec4 r;
	r.rgb = s0.rgb * a.x +
			s1.rgb * a.y +
			s2.rgb * a.z +
			s3.rgb * a.w;
	#ifdef RESOLVE_ALPHASATURATE
		r.a = w > 0.0 ? 1.0 : 0.0;
	#elif defined(RESOLVE_ALPHAIGNOREZERO)
		r.a = w;
		if( alphaCount > 0.0 )
		{ r.a /= alphaCount; }
	#else
		r.a = 0.25*w;
	#endif
	return r;
}

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	#define	SAMPLE4(TEX,OUT,COORD) {\
		float px = 0.5 * uInputRes.x, py = 0.5 * uInputRes.y;\
		OUT = combine(	texture2DLod( TEX, COORD + vec2( -px, -py ), 0.0 ),\
						texture2DLod( TEX, COORD + vec2(  px, -py ), 0.0 ),\
						texture2DLod( TEX, COORD + vec2( -px,  py ), 0.0 ),\
						texture2DLod( TEX, COORD + vec2(  px,  py ), 0.0 ) );\
	}

	#define	SAMPLE16(TEX,OUT,COORD) {\
		float rx = uInputRes.x, ry = uInputRes.y;\
		vec4 tmp0, tmp1, tmp2, tmp3;\
		SAMPLE4( TEX, tmp0, COORD + vec2( -rx, -ry ) );\
		SAMPLE4( TEX, tmp1, COORD + vec2(  rx, -ry ) );\
		SAMPLE4( TEX, tmp2, COORD + vec2( -rx,  ry ) );\
		SAMPLE4( TEX, tmp3, COORD + vec2(  rx,  ry ) );\
		OUT = combine( tmp0, tmp1, tmp2, tmp3 );\
	}

	#define	SAMPLE64(TEX,OUT,COORD) {\
		float dx = 2.0*uInputRes.x, dy = 2.0*uInputRes.y;\
		vec4 tmp4, tmp5, tmp6, tmp7;\
		SAMPLE16( TEX, tmp4, COORD + vec2(-dx, -dy) );\
		SAMPLE16( TEX, tmp5, COORD + vec2( dx, -dy) );\
		SAMPLE16( TEX, tmp6, COORD + vec2(-dx,  dy) );\
		SAMPLE16( TEX, tmp7, COORD + vec2( dx,  dy) );\
		OUT = combine( tmp4, tmp5, tmp6, tmp7 );\
	}

	#if SAMPLE_COUNT == 1
		// 1x sampling
		#define RESOLVE(TEX,OUT)	(OUT = texture2D( TEX, fCoord ))

	#elif SAMPLE_COUNT == 4
		// 4x sampling
		#define	RESOLVE(TEX,OUT)	SAMPLE4(TEX,OUT,fCoord)

	#elif SAMPLE_COUNT == 16
		// 16x sampling
		#define RESOLVE(TEX,OUT)	SAMPLE16(TEX,OUT,fCoord)

	#elif SAMPLE_COUNT == 64
		// 64x sampling
		#define RESOLVE(TEX,OUT)	SAMPLE64(TEX,OUT,fCoord)

	#else
		#error Resolve shader built with an unhandled sample count.

	#endif

	RESOLVE( tInput, OUT_COLOR0 );
}
