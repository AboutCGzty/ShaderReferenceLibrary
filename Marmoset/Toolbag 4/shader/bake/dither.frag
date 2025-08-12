#ifndef MSET_DITHER_SH
#define MSET_DITHER_SH

float	rand( float seed )
{
	return fract( cos( seed ) * 12345.6789 );
}

float	rand( vec2 seed )
{
	//Courtesy of Michael Pohoreski
	vec2 K = vec2(
		23.14069263277926, // e^pi (Gelfond's constant)
		2.665144142690225 // 2^sqrt(2) (Gelfond-Schneider constant)
	);
	return rand( dot(seed,K) );
}

vec2	rand2( float seed )
{
	return vec2(rand(seed), rand(seed + 29.0));
}

vec3	rand3( float seed )
{
	float theta = 2.0 * 3.141592 * rand( seed );
	float y = rand( seed + 31.0 ) * 2.0 - 1.0;
	float a = sqrt( 1.0 - y * y );
	return vec3( a * cos( theta ), y, a * sin( theta ) );
}

vec3	rand3( vec2 seed )
{
	return rand3( dot( seed, vec2( 23.14069263277926, 2.665144142690225 ) ) );
}

vec4	rand4( float seed )
{
	return vec4( rand( seed ), rand( seed + 3.0 ), rand( seed + 13.0 ), rand( seed + 29.0 ) );
}

vec3	dither8bit( vec3 c, vec2 noiseSeed )
{
	float incr = 1.0 / 255.0;
	vec3 m = frac( c * 255.0 );
	vec3 lo = c - m * incr;
	vec3 hi = lo + vec3( incr, incr, incr );

	float rnd = rand( noiseSeed );

	return vec3(	c.x = (m.x <= rnd ? lo.x : hi.x),
					c.y = (m.y <= rnd ? lo.y : hi.y),
					c.z = (m.z <= rnd ? lo.z : hi.z)	);
}

#endif
