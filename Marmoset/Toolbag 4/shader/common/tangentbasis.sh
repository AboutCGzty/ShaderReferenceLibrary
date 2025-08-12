#ifndef MSET_TANGENTBASIS_H
#define MSET_TANGENTBASIS_H

struct TangentBasis
{
	vec3 T; // tangent (X)
	vec3 B; // bitangent (Y)
	vec3 N; // normal (Z)
};

//create tangent basis around normal vector
TangentBasis createTangentBasis( vec3 normal )
{
	TangentBasis basis;

	HINT_FLATTEN
	if( normal.x != normal.y || normal.x != normal.z )
	{
		basis.T = cross( normal, vec3(1.0,1.0,1.0) );
	}
	else
	{
		basis.T = cross( normal, vec3(-1.0,1.0,1.0) );
	}
	basis.N = normal;
	basis.T = normalize( basis.T );
	basis.B = cross( basis.T, basis.N );
	return basis;
}

//create tangent basis around normal vector given tangent vector that might not be orthogonal
TangentBasis createTangentBasis( vec3 normal, vec3 tangent )
{
	TangentBasis basis;
	basis.N = normal;
	basis.B = normalize( cross( normal, tangent ) );
	basis.T = cross( basis.B, basis.N );
	return basis;
}

vec3 transformVecTo( TangentBasis basis, vec3 v )
{
	return vec3( dot( basis.T, v ), dot( basis.B, v ), dot( basis.N, v ) );
}

vec3 transformVecFrom( TangentBasis basis, vec3 v )
{
	return basis.T * v.x + basis.B * v.y + basis.N * v.z;
}

#endif