#ifndef LIGHT_FRAG
#define LIGHT_FRAG

#include "other/lightParams.frag"
#include "other/shadowParams.frag"

USE_TEXTURE2D(tSceneOcclusion);
uniform vec3	uOcclusionColor;
uniform uint	uOcclusionComposite;

USE_TEXTURE2D(tSceneReflectionMask);

#define	MAX_LIGHTS	48

uniform int		uLightCount;
uniform int		uLightShadowCount;

uniform vec4	uLightPosition[MAX_LIGHTS];		// { x, y, z, directional ? 0 : 1 }
uniform vec3	uLightColor[MAX_LIGHTS];		// { r, g, b }
uniform vec4    uLightX[MAX_LIGHTS];			// x,y,z, cos(spotAngle/2)
uniform vec4    uLightY[MAX_LIGHTS];			// x,y,z, spotSharpness
uniform vec4	uLightSize[MAX_LIGHTS];			// { x, y, z, cos(spotAngle/2) }, z is 'radius'

LightParams	computeLightParams( uint i, vec3 position )
{
	LightParams p;
	
	vec4 lightpos = uLightPosition[i];
	p.toSource.xyz = lightpos.xyz - position * lightpos.w;
	p.toSource.w = lightpos.w;
	p.invDistance = rsqrt( dot(p.toSource.xyz, p.toSource.xyz) );
	p.distance = rcp( p.invDistance );
	p.direction = p.toSource.xyz * p.invDistance;

	//attenuation: (note that ?: is more numerically stable than mix() -jdr)
	p.attenuation = lightpos.w ? (p.invDistance * p.invDistance) : 1.0;

	//area sizes
	vec4 lightSizeLoad = uLightSize[i];
	p.size = lightSizeLoad.xyz;
	vec4 xLoad = uLightX[i];
	p.axisX = xLoad.xyz;
	vec4 yLoad = uLightY[i];
	p.axisY = yLoad.xyz;

	//spot params
	p.spotParams.x = xLoad.w;
	p.spotParams.y = yLoad.w;

	//color
	p.color = uLightColor[i];

	//id
	p.id = float(i);

	//shadow
	p.shadow = vec4( 1.0, 1.0, 1.0, 1.0 );

	return p;
}

void	MaterialLighting( inout FragmentState s )
{
	//environment / IBL lighting
	#ifdef DiffusionParams
		DiffusionParams diffParams;
	#endif

	#ifdef DiffusionEnv
		#ifdef DiffusionParams
			DiffusionEnv(s, diffParams);
		#else
			DiffusionEnv(s);
		#endif
	#endif

	#ifndef ShadowCatcher
		#ifdef ReflectionEnv
			ReflectionEnv(s);
		#endif
		#ifdef ReflectionEnvSecondary
			ReflectionEnvSecondary(s);
		#endif
	#endif

	//occlusion
	#ifdef Occlusion
		Occlusion(s);
	#endif

	vec3 ao;
	{	
		float a = texture2DLod( tSceneOcclusion, s.screenTexCoord, 0.0 ).x;
		ao = (1.0-a)*uOcclusionColor + vec3(a,a,a);
	}
	if( uOcclusionComposite & 1 )
	{ s.diffuseLight *= ao; }

	//dynamic lights
	for( int i=0; i<uLightCount; ++i )
	{
		//initialize light params
		LightParams p = computeLightParams( i, s.vertexPosition );
		{
			//sample shadow maps
			p.shadow = i < uLightShadowCount ?
						sampleShadowMask( s.screenTexCoord, p.id ) :
						vec4(1.0,1.0,1.0,1.0);
		}

		#ifdef Diffusion
			#ifdef DiffusionParams
				Diffusion(s, p, diffParams);
			#else
				Diffusion(s, p);
			#endif
		#endif

		#ifndef ShadowCatcher
			#ifdef Reflection
				Reflection(s, p);
			#endif
			#ifdef ReflectionSecondary
				ReflectionSecondary(s, p);
			#endif
		#endif
	}

	if( uOcclusionComposite & 2 )
	{ s.diffuseLight *= ao; }
	if( uOcclusionComposite & 4 )
	{ s.specularLight *= min(min(ao.x,ao.y),ao.z); }

	//reflection masking
	s.specularLight *= texture2DLod( tSceneReflectionMask, s.screenTexCoord, 0.0 ).x;

	//cavity
	#ifdef Cavity
		Cavity(s);
	#endif
}
#define	Lighting	MaterialLighting

#endif