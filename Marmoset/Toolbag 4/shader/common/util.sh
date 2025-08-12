#ifndef MSET_UTIL_H
#define MSET_UTIL_H

#include "const.sh"

vec3	mulVec( mat4 m, vec3 v )
{
	return col0(m).xyz*v.x + (col1(m).xyz*v.y + (col2(m).xyz*v.z));
}

vec4	mulPoint( mat4 m, vec3 p )
{
	return col0(m)*p.x + (col1(m)*p.y + (col2(m)*p.z + col3(m)));
}

vec3	reflectVec( vec3 I, vec3 N )
{
	return -I + 2.0 * dot( N, I ) * N;
}

bool	refractVec( vec3 I, vec3 N, float eta, out vec3 T )
{
	float cosThetaI  = dot( N, I );
	float sin2ThetaT = eta * eta * saturate( 1.0 - cosThetaI*cosThetaI );
	if( sin2ThetaT >= 1.0 )
	{
		//total internal reflection
		T = vec3( 0.0, 0.0, 0.0 );
		return false;
	}
	else
	{
		float cosThetaT = sqrt( saturate( 1.0 - sin2ThetaT ) );
		T = eta * -I + ( eta * cosThetaI - cosThetaT ) * N;
		return true;
	}
}

float	average( vec3 v )
{
	return (1.0/3.0) * ( v.x + v.y + v.z );
}

float	maxcomp( vec3 v )
{
	return max( max( v.x, v.y ), v.z );
}

float	luminance( vec3 color )
{
	//relative luminance; expects linear RGB input (ITU BT.709)
	return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float	rcpSafe( float v )
{
	return v != 0.0 ? rcp( v ) : 0.0;
}

vec3	rcpSafe( vec3 v )
{
	vec3 inv = rcp( v );
	return vec3(
		v.x != 0.0 ? inv.x : 0.0,
		v.y != 0.0 ? inv.y : 0.0,
		v.z != 0.0 ? inv.z : 0.0
	);
}

vec3	rcpSafeInf( vec3 v )
{
	vec3 inv = rcp( v );
	return vec3(
		v.x != 0.0 ? inv.x : INFINITY,
		v.y != 0.0 ? inv.y : INFINITY,
		v.z != 0.0 ? inv.z : INFINITY
	);
}

vec3	normalizeSafe( vec3 v )
{
	float len2 = dot( v, v );
	return len2 > 0.0
		? v * rsqrt( len2 )
		: vec3(0.0, 0.0, 0.0);
}

vec3	oneminus( vec3 v )
{
	return saturate( vec3( 1.0-v.x, 1.0-v.y, 1.0-v.z ) );
}

uint	getVecOctant( vec3 v )
{
	return ( v.x < 0.0 ? 4 : 0 ) | ( v.y < 0.0 ? 2 : 0 ) | ( v.z < 0.0 ? 1 : 0 );
}

#endif