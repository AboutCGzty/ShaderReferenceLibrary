#include "data/shader/common/util.sh"
#include "data/shader/mat/state.frag"
#include "data/shader/mat/other/lightParams.frag"
#include "data/shader/mat/fresnel.frag"

#include "anisoParams.frag"

#ifndef ANISO_IMPORTANCE_SAMPLES
	#define ANISO_IMPORTANCE_SAMPLES 32
#endif

uniform vec4	_p(uAnisoRands)[ANISO_IMPORTANCE_SAMPLES];

void	ReflectionAnisotropicEnv( inout FragmentState s )
{
	float roughness = 1.0 - _p(s.gloss);
	float a, ax, ay;
	_p(anisoRoughnessToA)( roughness, a, ax, ay );

	vec3 basisX, basisY, basisZ = s.normal;
	_p(anisoGetBasis)( s, basisX, basisY );

	//a bit of per-pixel rotation to trade some artifacts for noise
	vec4 sampleRotate;
	{
		uint seed = ((s.screenCoord.x & 0xFFFF) | (s.screenCoord.y << 16));
		uint r = seed * 747796405 + 2891336453;
		r = ((r >> ((r >> 28) + 4)) ^ r) * 277803737;
		r = (r >> 22) ^ r;
		float rnd = float(r & 0xFFFF) * (1.0/float(0xFFFF));

		float sampleTheta = (2.0 * 3.141593) * rnd * _p(uAnisoDither);
		float sinTheta = sin(sampleTheta), cosTheta = cos(sampleTheta);
		sampleRotate = vec4( cosTheta, sinTheta, -sinTheta, cosTheta );
	}

	float NdotV = saturate(dot(s.normal,s.vertexEye));
	float lodBase = 0.5*log2( (256.0*256.0)/float(ANISO_IMPORTANCE_SAMPLES) ) + min(ax,ay);

	vec3 spec = vec3(0.0, 0.0, 0.0);
	HINT_UNROLL
	for( int i=0; i<ANISO_IMPORTANCE_SAMPLES; ++i )
	{
		//evaluate pdf for importance sampling
		vec3 localH; float invPDF;
		{
			//PDF is sampled with (sqrt(r1)/sqrt(1.0-r1)) * cos|sin( 2.0 * 3.141593 * r2 );
			vec3 rnd = _p(uAnisoRands)[i].xyz;
			vec2 dir = rnd.x * sampleRotate.xy + rnd.y * sampleRotate.zw;
			float xfactor = dir.x * rnd.z;
			float yfactor = dir.y * rnd.z;
			localH = normalize( vec3( xfactor * ax, yfactor * ay, 1.0 ) );

			float d = xfactor*xfactor + yfactor*yfactor + 1.0;
			invPDF = 3.141593 * ax*ay * max( d*d, 1e-6 );
		}
		vec3 H = localH.x * basisX + localH.y * basisY + localH.z * basisZ;
		vec3 L = (2.0 * dot( s.vertexEye, H )) * H - s.vertexEye;
		
		float NdotL = saturate(dot(s.normal,L));
		float NdotH = (localH.z);
		float VdotH = dot(s.vertexEye,H);

		//geometric / visibility
		//includes 1/(NdotL*NdotV) term
		float G;
		{	
			float k = a * 0.5;
			float G_SmithL = NdotL * (1.0 - k) + k;
			float G_SmithV = NdotV * (1.0 - k) + k;
			G = rcp( G_SmithL * G_SmithV );
		}
		
		//fresnel
		vec3 F = fresnelSchlick( _p(s.reflectivity), _p(s.fresnel), VdotH );

		//sample environment map
		float lod = lodBase + 0.35*log2( invPDF );
		vec3 lightSample = textureCubeLod( tReflectionCubeMap, L, lod ).xyz;

		spec += lightSample * F * G * abs(VdotH) * NdotL / abs(NdotH);
	}
	spec *= _p(uReflectionBrightness) * (1.0/float(ANISO_IMPORTANCE_SAMPLES));

	//clearcoat Fresnel throughput
	vec3 T = vec3( 1.0, 1.0, 1.0 );
	#if defined(REFLECTION_SECONDARY) && !defined(SUBROUTINE_SECONDARY)
		//clearcoat energy conservation
		T = oneminus( fresnelSchlick( s.reflectivitySecondary, s.fresnelSecondary, NdotV ) );
	#endif

	//add our contribution
	s.specularLight += T * spec;
}

void	ReflectionAnisotropicLight( inout FragmentState s, LightParams l )
{
	//roughness
	float roughness = 1.0 - _p(s.gloss);
	float a, ax, ay;
	_p(anisoRoughnessToA)( roughness, a, ax, ay );

	//Area light adjustments look a bit odd with anisotropy; could use improvement.
	adjustAreaLightSpecular( l, reflect( -s.vertexEye, s.normal ), rcp(3.141593*a*a) );

	//get tangent surface parameters
	vec3 tangent, bitangent;
	_p(anisoGetBasis)( s, tangent, bitangent );

	//various dot products
	vec3 H = normalize(l.direction + s.vertexEye);
	float NdotH = dot(s.normal,H);
	float NdotV = saturate(dot(s.normal,s.vertexEye));
	float NdotL = saturate(dot(s.normal,l.direction));
	float VdotH = saturate(dot(s.vertexEye,H));
	
	//incident light
	vec3 spec = l.color * l.shadow.rgb * l.attenuation * NdotL;
	
	//microfacet distribution (NDF)
	float D;
	{
		float Xfactor = dot(tangent,H) / ax;
		float Yfactor = dot(bitangent,H) / ay;
		float d = Xfactor*Xfactor + Yfactor*Yfactor + NdotH*NdotH;
		D = rcp( 3.141593 * ax * ay * max( d*d, 1e-6 ) );
	}
	
	//geometric / visibility
	float G;
	{
		//includes 1/(4*NdotL*NdotV) term
		float k = a * 0.5;
		float G_SmithL = NdotL * (1.0 - k) + k;
		float G_SmithV = NdotV * (1.0 - k) + k;
		G = 0.25 * rcp( G_SmithL * G_SmithV );
	}
	
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
	#define ReflectionEnvSecondary		ReflectionAnisotropicEnvSecondary
	#define ReflectionSecondary			ReflectionAnisotropicLightSecondary
	#undef ANISO_IMPORTANCE_SAMPLES
#else
	#define ReflectionEnv				ReflectionAnisotropicEnv
	#define Reflection					ReflectionAnisotropicLight
#endif
