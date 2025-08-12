#include "../../common/util.sh"
#include "data/shader/mat/light.frag"
#include "data/shader/bake/dither.frag"

uniform int uComponentMode;

#if defined(MATERIAL_PASS_COMPONENTVIEW)
uniform int		uComponentData;
uniform vec4	uComponentScalar0;
uniform vec4	uComponentScalar1;
uniform mat4	uComponentMat;
#endif

//utils

vec3 colorFromID( float id )
{
	float hue = frac( id * 0.618033988749895 );

	//hsv -> rgb color
	vec3 color;
	float v = 1.0, s = 1.0;
	float c = v * s;
	float h = mod( hue * 6.0, 6.0 );
	float x = c * ( 1.0 - abs( mod( h, 2.0 ) - 1.0) );

	HINT_FLATTEN
	if( h < 1.0 )
	{ color = vec3(c, x, 0.0); }
	
	else if( h < 2.0 )
	{ color = vec3(x, c, 0.0); }

	else if( h < 3.0 )
	{ color = vec3(0.0, c, x); }

	else if( h < 4.0 )
	{ color = vec3(0.0, x, c); }
	
	else if( h < 5.0 )
	{ color = vec3(x, 0.0, c); }

	else //if( h < 6.0 )
	{ color = vec3(c, 0.0, x); }

	return color;
}

//=============================================================

//Surface
void ComponentViewSurface( inout FragmentState s )
{
	#ifdef Surface
		Surface(s);
	#endif

	if( uComponentMode == 3 )
	{
		s.normal = s.vertexNormal;
	}
}

#ifdef Surface
	#undef Surface
#endif
#define	Surface	ComponentViewSurface

//=============================================================

//Albedo
void	ComponentViewAlbedo( inout FragmentState s )
{
	#ifdef Albedo
		Albedo(s);
	#endif

	if( uComponentMode >= 2 && uComponentMode <= 3 )
	{
		s.albedo.rgb = vec3( 0.5, 0.5, 0.5 );
		s.albedo.a = 1.0;
	}
}

#ifdef Albedo
	#undef Albedo
#endif
#define Albedo	ComponentViewAlbedo

//=============================================================
		
//Reflectivity
void	ComponentViewReflectivity( inout FragmentState s )
{
	HINT_BRANCH
	if( uComponentMode >= 2 && uComponentMode <= 3 )
	{
		s.reflectivity = vec3( .04, .04, .04 );
		s.reflectivitySecondary = vec3( 0.0, 0.0, 0.0 );
		s.metalness = 0.0;
	}
	else if( uComponentMode == 12 && uComponentData == 1 )
	{
		#ifdef Reflectivity
			Reflectivity( s );
		#endif
	}
	else if( uComponentMode == 15 ||  uComponentMode == 16 )
	{
		#ifdef Reflectivity
			Reflectivity( s );
		#endif
	}
}

#ifdef Reflectivity
	#undef Reflectivity
#endif
#define Reflectivity	ComponentViewReflectivity


//=============================================================
		
//Transmission
void	ComponentViewTransmission( inout FragmentState s )
{
	HINT_BRANCH
	if( uComponentMode == 2 || uComponentMode == 3 )
	{
		s.transmissivity = vec3(0.0,0.0,0.0);
	}
	else if( uComponentMode <= 1 || uComponentMode == 18 )
	{
		#ifdef Transmission
			Transmission( s );
		#endif
	}
}

#ifdef Transmission
	#undef Transmission
#endif
#define Transmission	ComponentViewTransmission


//=============================================================
		
//Transmissivity
void	ComponentViewTransmissivity( inout FragmentState s )
{
	HINT_BRANCH
	if( uComponentMode == 2 || uComponentMode == 3 )
	{
		s.transmissivity = vec3(0.0,0.0,0.0);
	}
	else if( uComponentMode <= 1 || uComponentMode == 18 )
	{
		#ifdef Transmissivity
			Transmissivity( s );
		#endif
	}
}

#ifdef Transmissivity
	#undef Transmissivity
#endif
#define Transmissivity	ComponentViewTransmissivity

//=============================================================
		
//Occlusion/Cavity
void	ComponentViewOcclusion( inout FragmentState s )
{
	#ifdef Occlusion
	if( uComponentMode <= 2 )
	{
		Occlusion( s );
	}
	else
	{
		s.occlusion = 1.0;
	}
	#endif
}

#ifdef Occlusion
	#undef Occlusion
#endif
#define Occlusion	ComponentViewOcclusion

void	ComponentViewCavity( inout FragmentState s )
{
	#ifdef Cavity
	if( uComponentMode <= 2 )
	{
		Cavity( s );
	}
	else
	{
		s.cavity = 1.0;
	}
	#endif
}

#ifdef Cavity
	#undef Cavity
#endif
#define Cavity	ComponentViewCavity

//=============================================================
		
//Microsurface
void	ComponentViewMicrosurface( inout FragmentState s )
{
	#ifdef Microsurface
		Microsurface(s);
	#endif

	HINT_BRANCH
	if( uComponentMode >= 2 && uComponentMode <= 3 )
	{
		s.gloss = 0.75;
	}
}

#ifdef Microsurface
	#undef Microsurface
#endif
#define Microsurface	ComponentViewMicrosurface

//=============================================================

//Emissive
void	ComponentViewEmissive( inout FragmentState s )
{
	HINT_BRANCH
	if( uComponentMode == 13 || uComponentMode == 5 )
	{
	#ifdef Emissive
		Emissive( s );
	#endif
	}
}

#ifdef Emissive
	#undef Emissive
#endif
#define Emissive	ComponentViewEmissive

//=============================================================

//Transparency
void	ComponentViewTransparency( inout FragmentState s )
{
	if( uComponentMode == 3 || uComponentMode == 18 )
	{
	#ifdef ALPHABASE
		AlphaBase( s );
	#endif
	}
	else
	{
	#ifdef Transparency
		Transparency( s );
	#endif
	}

}

#ifdef Transparency
	#undef Transparency
#endif
#define	Transparency	ComponentViewTransparency

//=============================================================

//Merge
#if defined(MATERIAL_PASS_COMPONENTVIEW)

void	ComponentViewMerge( inout FragmentState s )
{
	//basic lighting
	s.output0.xyz =	s.diffuseLight + s.specularLight + s.emissiveLight;
	s.output0.a = 1.0;
	
	if( uComponentMode == 4 ) //wireframe
	{
		s.output0.rgba = vec4( 0.0, 0.0, 0.0, 0.0 );
	}
	else if( uComponentMode == 5 )	//alpha mask
	{
		s.output0.xyz = 1.0;
		#ifdef LightMerge_AlphaOut
			s.output0 = s.albedo.aaaa;
		#endif
	}
	else if( uComponentMode == 6 )	//depth
	{
		float depth = mulVec( uComponentMat, s.vertexPosition ).z;

		//view depth
		if( uComponentData == 0 )
		{
			//bounding sphere
			if( uComponentScalar0.y - uComponentScalar0.x > 0.0 )
			{
				float mn = uComponentScalar0.x;
				float mx = uComponentScalar0.y;
				float r = uComponentScalar0.z;
				mn = sign( mn ) * r;
				mx = sign( mx ) * r;

				depth = ( depth - mn ) / ( mx - mn );
			}
		}
		else if( uComponentData == 1 )
		{
			//bounding box
			if( uComponentScalar0.y - uComponentScalar0.x > 0.0 )
			{
				float mn = uComponentScalar0.x;
				float mx = uComponentScalar0.y;
				float r = uComponentScalar0.z;

				depth = ( depth - mn ) / ( mx - mn );
			}
		}
		else
		{
			depth = 1.0 - s.vertexEyeDistance;
		}

		if( uComponentScalar0.w > 0.0 )
		{
			depth = dither8bit( vec3( depth, depth, depth ), s.screenTexCoord ).x;
		}

		s.output0.xyz = vec3( depth, depth, depth );
	}
	else if( uComponentMode == 7 )	//incidence; normal dot view
	{
		float incidence = dot( s.normal, s.vertexEye );
		s.output0.xyz = 0.5 * vec3( incidence, incidence, incidence ) + vec3( 0.5, 0.5, 0.5 );
	}
	else if( uComponentMode == 8 )	//normal
	{
		//object
		vec3 n = s.normal;
		n *= uComponentScalar0.xyz;
		n = 0.5 * n + vec3( 0.5, 0.5, 0.5 );

		//tangent
		if( uComponentData == 1 )
		{
			float xx = dot( s.normal, s.vertexTangent );
			float yy = dot( s.normal, s.vertexBitangent );
			float zz = dot( s.normal, s.vertexNormal );
			n = normalize( vec3( xx, yy, zz ) );
			n *= uComponentScalar0.xyz;
			n = 0.5 * n + vec3( 0.5, 0.5, 0.5 );
		}
		//view
		if( uComponentData == 2 )
		{
			n = mulVec( uComponentMat, s.normal );
			n *= uComponentScalar0.xyz;
			n = 0.5 * n + vec3( 0.5, 0.5, 0.0 );
			n.z = 0.0;
		}
		
		s.output0.xyz = n;
	}
	else if( uComponentMode == 9 )	//position
	{	

		vec3 p = s.vertexPosition.xyz;
		//max - min
		vec3 boxDimensions = uComponentScalar1.xyz - uComponentScalar0.xyz;
		//bounding sphere
		if( uComponentData == 0 )
		{
			float boxMaxDimension = max( boxDimensions.x, max( boxDimensions.y, boxDimensions.z ) );
			vec3 stretch = boxDimensions /  boxMaxDimension;
			vec3 stretchBounds = ( 1.0 - stretch ) / 2.0;

			p -= uComponentScalar0.xyz;
			p /= boxDimensions;

			p *= stretch;
			p += stretchBounds;
		}
		//bounding box
		if( uComponentData == 1 )
		{
			p -= uComponentScalar0.xyz;
			p /= boxDimensions;
		}
		
		if( uComponentScalar0.w > 0.0 )
		{ p = dither8bit( p, s.screenTexCoord ); }
		
		s.output0.xyz = p;
	}
	else if( uComponentMode == 10 )
	{
		//material id
		s.output0.xyz = colorFromID( mod( float( uComponentData ), 1024.0 ) );
	}
	else if( uComponentMode == 11 )
	{		
		//object id
		s.output0.xyz = colorFromID( mod( float( uComponentData ), 1024.0 ) );
	}
	else if( uComponentMode == 12 )
	{
		//albedo
		vec3 albedo = s.albedo.xyz;
		s.output0.xyz = albedo;
	}
	else if( uComponentMode == 13 )
	{
		//emissive
		s.output0.xyz = s.emissiveLight;
	}
	else if( uComponentMode == 14 )
	{
		//gloss
		s.output0.xyz = vec3(s.gloss, s.gloss, s.gloss);
	}
	else if( uComponentMode == 15 )
	{
		//metalness
		s.output0.xyz = vec3( s.metalness, s.metalness, s.metalness );
	}
	else if( uComponentMode == 16 )
	{
		//reflectivity
		s.output0.xyz = s.reflectivity.rgb;
	}
	else if( uComponentMode == 17 )
	{
		//roughness
		s.output0.xyz = vec3(1.0 - s.gloss, 1.0 - s.gloss, 1.0 - s.gloss);
	}
	else if( uComponentMode == 18 )
	{
		//transparency
		s.output0.xyz = s.albedo.aaa;
		s.output0.w = 1.0;
	}

	//alpha cutout:
	s.output0.a = s.albedo.a;
}
#ifdef Merge
	#undef Merge
#endif
#define Merge	ComponentViewMerge

#endif