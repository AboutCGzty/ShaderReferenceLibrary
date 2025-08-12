#ifndef MSET_OCTPACK_H
#define MSET_OCTPACK_H

uint	packUnitVectorOct( vec3 dir )
{
	//octahedral projection from arbitrary 3D to [0,1] 2D
	dir /= ( abs(dir.x) + abs(dir.y) + abs(dir.z) );
	vec2 rev = abs(dir.zx) - vec2(1.0,1.0);
	vec2 neg = vec2(	dir.x < 0.0 ? rev.x : -rev.x,
						dir.z < 0.0 ? rev.y : -rev.y );
	vec2 uv = (dir.y < 0.0) ? neg : dir.xz;
	
	float c = 0.5 * 65535.0;
	uv = uv * c + vec2(c,c);

	uint p = (uint(uv.x) << 16) | uint(uv.y);
	return p;
}

vec3	unpackUnitVectorOct( uint p )
{
	//octahedral projection
	vec2 uv = vec2(	float(p >> 16), float(p & 0xFFFF) );
	uv = (2.0/65535.0) * uv - vec2(1.0,1.0);
	vec3 dir;
	if( (abs(uv.x) + abs(uv.y)) <= 1.0 )
	{
		//positive hemisphere
		dir = vec3( uv.x, 1.0-abs(uv.x)-abs(uv.y), uv.y );
	}
	else
	{
		//negative hemisphere
		vec2 signuv = sign(uv);
		uv = signuv - (signuv.x*signuv.y)*uv.yx;
		dir = vec3( uv.x, abs(uv.x)+abs(uv.y)-1.0, uv.y );
	}
	return normalize(dir);
}

#endif
