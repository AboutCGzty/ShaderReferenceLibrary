#include "data/shader/common/util.sh"
#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/lightParams.frag"
#include "data/shader/mat/fresnel.frag"

#ifndef GGX_IMPORTANCE_SAMPLES
	#define GGX_IMPORTANCE_SAMPLES	24
#endif

#ifndef REFLECTION_CUBE_MAP
#define REFLECTION_CUBE_MAP
USE_TEXTURECUBE(tReflectionCubeMap);
#endif

uniform float	_p(uReflectionBrightness);
uniform float	_p(uGGXDither);
uniform vec4	_p(uGGXRands)[GGX_IMPORTANCE_SAMPLES]; //{ r1, r2, cos( 2*pi*r2 ), sin( 2*pi*r2 ) }

void	ReflectionGGXEnv( inout FragmentState s )
{
	float gloss = _p(s.gloss);
	float roughness = 1.0 - gloss;
	float a = max( roughness * roughness, 1e-3 );
	float k = a * 0.5;
	float a2 = a*a;

	vec3 basisX = normalize( cross( s.normal, vec3(0.0, 12.0, s.normal.y) ) );
	vec3 basisY = cross( basisX, s.normal );
	vec3 basisZ = s.normal;

	vec4 sampleRotate;
	{
		uint seed = ((s.screenCoord.x & 0xFFFF) | (s.screenCoord.y << 16));
		uint r = seed * 747796405 + 2891336453;
		r = ((r >> ((r >> 28) + 4)) ^ r) * 277803737;
		r = (r >> 22) ^ r;
		float rnd = float(r & 0xFFFF) * (1.0/float(0xFFFF));

		float sampleTheta = (2.0 * 3.141593) * rnd * _p(uGGXDither);
		float sinTheta = sin(sampleTheta), cosTheta = cos(sampleTheta);
		sampleRotate = vec4( cosTheta, sinTheta, -sinTheta, cosTheta );
	}

	float NdotV = saturate( dot( s.normal, s.vertexEye) );
	float lodBase = 0.5 * log2( (256.0*256.0)/float(GGX_IMPORTANCE_SAMPLES) );

	vec3 spec = vec3(0.0, 0.0, 0.0);
	HINT_UNROLL
	for( int i=0; i<GGX_IMPORTANCE_SAMPLES; i++ )
	{
		vec3 Hlocal;
		{
			vec4 r = _p(uGGXRands)[i];
			float cosTheta = sqrt( (1.0 - r.x) / ((a2 - 1.0) * r.x + 1.0) );
			float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
			vec2 dir = r.z * sampleRotate.xy + r.w * sampleRotate.zw;
			Hlocal = vec3( dir.x*sinTheta, dir.y*sinTheta, cosTheta );
		}

		vec3 H = Hlocal.x*basisX + Hlocal.y*basisY + Hlocal.z*basisZ;
		vec3 L = (2.0 * dot( s.vertexEye, H )) * H - s.vertexEye;
		
		float NdotH = saturate( dot(s.normal, H) );
		float NdotL = saturate( dot(s.normal, L) );
		float VdotH = saturate( dot(s.vertexEye, H) );
		
		float d = (NdotH * a2 - NdotH) * NdotH + 1.0;
		float pdf = (NdotH * a2) / ((4.0 * 3.141593) * d*d * VdotH);

		float lod = lodBase - 0.6*log2( pdf );
		vec3 lightSample = textureCubeLod( tReflectionCubeMap, L, lod ).xyz;

		//geometric / visibility
		//includes a variety of BRDF terms as well
		float G;
		{
			float G_SmithL = NdotL * (1.0 - k) + k;
			float G_SmithV = NdotV * (1.0 - k) + k;
			G = abs(NdotV) * NdotL / ( G_SmithL * G_SmithV * abs(NdotH) );
		}
	
		vec3 F = fresnelSchlick( _p(s.reflectivity), _p(s.fresnel), VdotH );

		spec += lightSample * F * G;
	}
	spec *= (1.0/float(GGX_IMPORTANCE_SAMPLES)) * _p(uReflectionBrightness);

	//clearcoat Fresnel throughput
	vec3 T = vec3( 1.0, 1.0, 1.0 );
	#if defined(REFLECTION_SECONDARY) && !defined(SUBROUTINE_SECONDARY)
		//clearcoat energy conservation
		T = oneminus( fresnelSchlick( s.reflectivitySecondary, s.fresnelSecondary, NdotV ) );
	#endif
	
	//add our contribution
	s.specularLight += T * spec;
}

void	ReflectionGGXLight( inout FragmentState s, LightParams l )
{
	//roughness
	float roughness = 1.0 - _p(s.gloss);
	float a = max( roughness * roughness, 1e-3 );
	float a2 = a * a;

	//light params
	adjustAreaLightSpecular( l, reflect( -s.vertexEye, s.normal ), rcp(3.141593 * a2) );

	//various dot products
	vec3 H = normalize(l.direction + s.vertexEye);
	float NdotV = saturate(dot(s.vertexEye,s.normal));
	float NdotH = saturate(dot(s.normal,H));
	float NdotL = saturate(dot(l.direction,s.normal));
	float VdotH = saturate(dot(s.vertexEye,H));
	
	//incident light
	vec3 spec = l.color * l.shadow.rgb * l.attenuation * NdotL;
	
	//microfacet distribution
	float d = ( NdotH * a2 - NdotH ) * NdotH + 1.0;
	float D = a2 / (3.141593 * d*d);

	//geometric / visibility
	float k = a * 0.5;
	float G_SmithL = NdotL * (1.0 - k) + k;
	float G_SmithV = NdotV * (1.0 - k) + k;
	float G = 0.25 / ( G_SmithL * G_SmithV );
	
	//fresnel
	vec3 F = fresnelSchlick( _p(s.reflectivity), _p(s.fresnel), VdotH );
	
	//clearcoat Fresnel throughput
	vec3 T = vec3( 1.0, 1.0, 1.0 );
	#if defined(REFLECTION_SECONDARY) && !defined(SUBROUTINE_SECONDARY)
		T = oneminus( fresnelSchlick( s.reflectivitySecondary, s.fresnelSecondary, NdotV ) );
	#endif

	//final
	s.specularLight += T * (D * G) * (F * spec);
}

#ifdef SUBROUTINE_SECONDARY
	#define ReflectionEnvSecondary		ReflectionGGXEnvSecondary
	#define ReflectionSecondary			ReflectionGGXLightSecondary
#else
	#define ReflectionEnv				ReflectionGGXEnv
	#define Reflection					ReflectionGGXLight
#endif
