#ifndef LAYER_PROJECTOR_SH
#define LAYER_PROJECTOR_SH

#include "../../common/util.sh"


// -- Matrix Math --
//CPR gets column-major matrices from c++, and stores basis vectors in columns.
//CPR matrix columns should be accessed with the col0 .. col3 macros.
//Metal and GLSL mat[i] access returns columns, HLSL returns rows.
//Matrix-vector multiply is <row0.vec, row1.vec, row2.vec, row3.vec>
//CPR matrix-vector multiply is mul() and mulPoint()

// -- Normal Math -- 
// Triplanar UVs are determined by two matrices: textureMatrix and the projector.
// The texture matrix is uv scale, offset, and rotation (UV TRS).
// Normal maps need an inverse UV-rotation performed on them after sampling.

// The projector matrix represents an arbitrary projector plane (with TBN bases) and is used to generate texture UVs from vertex positions.
// Three projector planes generate three sets of texture UVs. The results of these texture UVs are faded between by surface normal.
// When projecting normal maps 

// -- LayerRender Modelview --
// *** Compositing happens in projector space ***. The projector matrix is stored in the view portion of the Modelview matrix passed to the 
// vertex shader. This means every fragment rendered, every vertex position, and ever tangent vector is in projector-space when 
// compositing layers.

uniform float	uTripFade;
uniform float	uTripBend;
uniform float	uTripFragNormal;
uniform int		uPlanarClampCoords;	//planar mode can optionally clamp uv texture tiling


float	mix3( float a, float b, float c, vec3 w)
{ return a*w.x + b*w.y + c*w.z; }

vec2	mix3( vec2 a, vec2 b, vec2 c, vec3 w)
{ return a*w.x + b*w.y + c*w.z; }

vec3	mix3( vec3 a, vec3 b, vec3 c, vec3 w)
{ return a*w.x + b*w.y + c*w.z; }

vec4	mix3( vec4 a, vec4 b, vec4 c, vec3 w)
{ return a*w.x + b*w.y + c*w.z; }

struct ProjectorPlane
{
	vec3 U;
	vec3 V;
};

struct PlanarSampler
{
	vec3 T;
	vec3 B;
	vec3 N;
	vec2 uv;
	ProjectorPlane plane;
};

struct TriplanarSampler
{
	vec3 T;
	vec3 B;
	vec3 N;
	vec3 fade;	
	vec4 facing;

	//use these to sample the same image from 3 different angles
	vec2 uvX;
	vec2 uvY;
	vec2 uvZ;

	ProjectorPlane triplaneX;
	ProjectorPlane triplaneY;
	ProjectorPlane triplaneZ;
};



/// Do this between getTriplanarSampler() and triplanarMix():
// tap_x = texture2D( [projected texture], p.uvX );
// tap_y = texture2D( [projected texture], p.uvY );
// tap_z = texture2D( [projected texture], p.uvZ );

vec3 _toSpace( vec3 n, mat4 TBN )
{
	return  vec3(
		dot( n, col0(TBN).xyz ), 
		dot( n, col1(TBN).xyz ), 
		dot( n, col2(TBN).xyz )
	);
}

vec3 _toSpace( vec3 n, vec3 tangent, vec3 bitangent, vec3 normal )
{
	return vec3(
		dot( n, tangent ),
		dot( n, bitangent ),
		dot( n, normal )
	);
}

mat4 _toSpace( mat4 m, mat4 TBN )
{ return mul( transpose(TBN), m ); }

vec3 _fromSpace( vec3 n, mat4 TBN )
{ return mulVec( TBN, n ); }

vec3 _fromSpace( vec3 n, vec3 tangent, vec3 bitangent, vec3 normal )
{ return n.x * tangent + (n.y * bitangent + (n.z * normal)); }

mat4 _fromSpace( mat4 m, mat4 TBN )
{ return mul( TBN, m ); }

mat4 _identity()
{ 
	return mat4(
		1.0, 0.0, 0.0, 0.0, 
		0.0, 1.0, 0.0, 0.0, 
		0.0, 0.0, 1.0, 0.0, 
		0.0, 0.0, 0.0, 1.0
	);
}

///

//A tangent-space normal map that is projected onto an actual mesh needs to be transmogrified to fit that meshs tangent layout.
// Here we consider tap_x,_y, and _z to be projector-space normals, oriented along each projector face. We need to transform the
// normals to mesh tangent space after projection. 

// 1. transform projector TBN vectors to mesh tangent space
// 2. "flatten" the projector TBN vectors along the mesh surface by setting .z to 0
// 3. orthonormalize and store in surf_xyz_TBN
// 4. surf_xyz_TBN are matrices to take normals in projector-space to mesh-tangent-space

///

// old, complex function used by PaintMerge.frag exclusively
void projectPremultTangents( out mat4 surfTBN, in mat4 meshTBN, in ProjectorPlane plane )
{
	surfTBN = _identity();
	
	//Get projector cube bases in mesh tangent space    
	vec3 T, B, N;

    T = _toSpace( plane.U, meshTBN );
    B = _toSpace( plane.V, meshTBN );

	N = vec3(0.0,0.0,1.0);
	T = normalize( T - dot( T, N) * N );
    B = normalize( B - dot( B, N) * N );

	col0( surfTBN ).xyz = T;
	col1( surfTBN ).xyz = B;
	col2( surfTBN ).xyz = N;
}

void projectTangents( out mat4 surfTBN, in vec3 meshN, in ProjectorPlane plane )
{
	surfTBN = _identity();
	vec3 surfT = plane.U;
	vec3 surfB = plane.V;
	vec3 surfN = meshN;

	col0(surfTBN).xyz = normalize( surfT - dot( surfT, surfN) * surfN );
	col1(surfTBN).xyz = normalize( surfB - dot( surfB, surfN) * surfN );
	col2(surfTBN).xyz = surfN;
}

vec4 monoplanarMix( in TriplanarSampler p, vec4 tap)
{
#if LAYER_OUTPUT == CHANNEL_NORMAL
	ProjectorPlane plane;
	plane.U = mix3(p.triplaneX.U, p.triplaneY.U, p.triplaneZ.U, p.fade.xyz);
	plane.V = mix3(p.triplaneX.V, p.triplaneY.V, p.triplaneZ.V, p.fade.xyz);	
	
	tap.xyz = tap.xyz * 2.0 - vec3(1.0, 1.0, 1.0);
	
	//projection-space to mesh-space transforms		
	mat4 meshTBN = _identity();
	col0(meshTBN).xyz = p.T;
	col1(meshTBN).xyz = p.B;
	col2(meshTBN).xyz = p.N;

	mat4 surfTBN;
	projectTangents( surfTBN, p.N, p.triplaneZ );
	
	//pull taps from projector-space to mesh-space
	tap.xyz = _fromSpace( tap.xyz, surfTBN );	
	tap.xyz = _toSpace( tap.xyz, meshTBN );
	tap.xyz = normalize(tap.xyz) * 0.5 + vec3(0.5,0.5,0.5);
#endif
	return tap;
}

vec4 triplanarMix( in TriplanarSampler p, vec4 tap_x, vec4 tap_y, vec4 tap_z )
{	
#if LAYER_OUTPUT == CHANNEL_NORMAL
	tap_x.xyz = tap_x.xyz * 2.0 - vec3(1.0, 1.0, 1.0);
	tap_y.xyz = tap_y.xyz * 2.0 - vec3(1.0, 1.0, 1.0);
	tap_z.xyz = tap_z.xyz * 2.0 - vec3(1.0, 1.0, 1.0);

	//projection-space to mesh-space transforms		
	mat4 meshTBN = _identity();
	col0(meshTBN).xyz = p.T;
	col1(meshTBN).xyz = p.B;
	col2(meshTBN).xyz = p.N;

	mat4 xsurfTBN, ysurfTBN, zsurfTBN;

	projectTangents( xsurfTBN, p.N, p.triplaneX );
	projectTangents( ysurfTBN, p.N, p.triplaneY );
	projectTangents( zsurfTBN, p.N, p.triplaneZ );
	
	//pull taps from projector-space to obj-space
	tap_x.xyz = _fromSpace( tap_x.xyz, xsurfTBN );
	tap_y.xyz = _fromSpace( tap_y.xyz, ysurfTBN );
	tap_z.xyz = _fromSpace( tap_z.xyz, zsurfTBN );
#endif 

	vec4 tap = 
		p.fade.x * tap_x + 
		p.fade.y * tap_y + 
		p.fade.z * tap_z;
	
#if LAYER_OUTPUT == CHANNEL_NORMAL
	//put tap into mesh-tangent-space
	tap.xyz = _toSpace( tap.xyz, meshTBN );
	tap.xyz = normalize(tap.xyz) * 0.5 + vec3(0.5,0.5,0.5);
#endif
	return tap;
}

// simpler projector with vertex tangent space only
TriplanarSampler getTriplanarSampler( vec3 fP, vec3 vT, vec3 vB, vec3 vN )
{
	TriplanarSampler p;
	p.T = vT;
	p.B = vB;
	p.N = vN;

	/// Triplanar Fade 	
	p.fade = pow(p.N * p.N, 1.0 / (0.015 + (1.25 * uTripFade)));
	p.fade = p.fade / (p.fade.x + p.fade.y + p.fade.z);


	/// Triplanar Tap
	vec3 triPosition = fP;

	triPosition.z = -triPosition.z; //@@@ Why? Does this correlate to the z-flip in merge?
	triPosition = 0.5 * triPosition + vec3(0.5,0.5,0.5);

	p.facing.xyz = sign(p.N);	//positive or negative face of projector cube?
	p.facing.w = 1.0;			//how handy.

	p.uvX = triPosition.zy * p.facing.xw;
	p.uvY = triPosition.xz * p.facing.yw;
	p.uvZ = triPosition.xy * p.facing.zw;

	// UV scale/offset
	p.uvX = 		
		col0(uTextureMatrix).xy * p.uvX.x + 
		col1(uTextureMatrix).xy * p.uvX.y + 
		col3(uTextureMatrix).xy;
	p.uvY = 
		col0(uTextureMatrix).xy * p.uvY.x + 
		col1(uTextureMatrix).xy * p.uvY.y + 
		col3(uTextureMatrix).xy;
	p.uvZ = 
		col0(uTextureMatrix).xy * p.uvZ.x + 
		col1(uTextureMatrix).xy * p.uvZ.y + 
		col3(uTextureMatrix).xy;
		
	/// triplanar face orientations		
	const vec3 X = vec3(1.0,0.0,0.0);
	const vec3 Y = vec3(0.0,1.0,0.0);
	const vec3 Z = vec3(0.0,0.0,1.0);

	p.triplaneX.U = -Z * p.facing.x;
	p.triplaneX.V =  Y;
	p.triplaneY.U = X * p.facing.y;
	p.triplaneY.V = -Z;
	p.triplaneZ.U = X * p.facing.z;
	p.triplaneZ.V = Y;

	return p;
}

/// projector with fragment normal present
TriplanarSampler getTriplanarSampler( vec3 fP, vec3 vT, vec3 vB, vec3 vN, vec3 fN )
{
	
	/// Compute "bent" fragment position
	vec3 bend = vN * uTripBend * (1.0-abs(fN.z));
	
	//@@@ Mystery: Why does an arbitrarily transformed tangent space still work for an input normal clearly meant for the original mesh?
	//@@@ Guess: this creating a tangent space from the input normal business accounts for it somehow
	
	/// Create whole new tangent-space		
	fN = _fromSpace( fN.xyz, vT, vB, vN );
	vec3 N = normalize( lerp( vN, fN, uTripFragNormal ) );
	vec3 T = normalize( vT - dot(vT, N) * N );
	vec3 B = normalize( vB - dot(vB, N) * N );

	return getTriplanarSampler( fP + bend, T, B, N );
}


///

vec2 projectPlanarCoordinates(vec3 coord)
{
	coord *= 0.5;
	coord.x += 0.5;
	coord.y += 0.5;
	coord.z += 0.5;
	vec2 uv;
	uv.x = coord.x;
	uv.y = coord.y;
	uv = 
		col0(uTextureMatrix).xy * uv.x + 
		col1(uTextureMatrix).xy * uv.y + 
		col3(uTextureMatrix).xy;
	if( uPlanarClampCoords != 0 )
	{ uv = clamp(uv, 0.0, 1.0); }
	return uv;
}

PlanarSampler getPlanarSampler( vec3 fP, vec3 vT, vec3 vB, vec3 vN )
{
	PlanarSampler p;

	/// Projector-space tangent vectors at fP
	p.T = vT;		
	p.B = vB;
	p.N = vN;

	/// Planar Tap
	p.uv = projectPlanarCoordinates( fP );

	/// Projector-space plane axes (always XY constants)
	p.plane.U = vec3(1.0,0.0,0.0);
	p.plane.V = vec3(0.0,1.0,0.0);
	return p;
}

PlanarSampler getPlanarSampler( vec3 fP, vec3 vT, vec3 vB, vec3 vN, vec3 fN )
{
	//transform input normal into same projection-object space as the mesh tangents are
	fN = _fromSpace( fN.xyz, vT, vB, vN );
	return getPlanarSampler( fP, vT, vB, fN );
}

vec4 planarMix( in PlanarSampler samp, vec4 tap)
{
	/// Retagentiation
#if LAYER_OUTPUT == CHANNEL_NORMAL
	tap.xyz = tap.xyz * 2.0 - vec3(1.0, 1.0, 1.0);
	
	//projection-space to mesh-space transforms		
	mat4 meshTBN = _identity();
	col0(meshTBN).xyz = samp.T;
	col1(meshTBN).xyz = samp.B;
	col2(meshTBN).xyz = samp.N;

	mat4 surfTBN;
	projectTangents( surfTBN, samp.N, samp.plane );

	//pull taps from projector-space to mesh-space
	tap.xyz = _fromSpace( tap.xyz, surfTBN );	// pull texture taps out of projector-tangent-space into projector-object-space
	tap.xyz = _toSpace( tap.xyz, meshTBN );		// put proj-obj-space tap into mesh-tangent-space for final compositing
	tap.xyz = normalize(tap.xyz) * 0.5 + vec3(0.5,0.5,0.5);
#endif
	return tap;
}



#endif
