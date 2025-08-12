#include "data/shader/common/util.sh"
#include "data/shader/mat/fresnel.frag"
#include "data/shader/mat/other/remap.frag"

USE_TEXTURE2D(tRefractionBackground);

uniform mat4	uRefractionViewProjection;
uniform vec2	uRefractionPixelSize; // { 1/w, 1/h }
uniform float	uRefractionMaxLOD;
uniform float	uRefractionRayDistance;
uniform float	uRefractionIORSquash;
uniform float	uRefractionDither;

void	TransmissionRefraction( inout FragmentState s )
{
	float eta = mix( s.eta, 1.0, uRefractionIORSquash );
	float ior = rcp( eta );

	//find proper refraction direction
	vec3 d = refract( -s.vertexEye, s.normal, eta );

	//estimate ray distance. since we're not tracing a real ray,
	//we approximate the intersection based on mesh scale and IOR value
	float rayDistance = uRefractionRayDistance * max( ior-1.0, 0.0 );

	//march the ray out a bit, then project that point
	d = s.vertexPosition + d * rayDistance;
	vec4 proj = mulPoint( uRefractionViewProjection, d );
	vec2 c = proj.xy / proj.w;
	#ifdef RENDERTARGET_Y_DOWN
		c.y = -c.y;
	#endif
	c = 0.5*c + vec2(0.5,0.5);

	//sample the background
	float lod = uRefractionMaxLOD - uRefractionMaxLOD * (s.gloss * s.gloss);
	vec3 background = texture2DLod( tRefractionBackground, c, lod ).xyz;
	
	vec2 psize = uRefractionPixelSize * exp2( lod ) * saturate(lod) * 0.5;
	
	//background blur samples
	vec2 K = vec2( 23.14069263277926, 2.665144142690225 );
	float rnd = fract( cos( dot(vec2(s.screenCoord),K) ) * 12345.6789 );
	float sampleTheta = (2.0 * 3.141593) * rnd * uRefractionDither;
	float sinTheta = sin(sampleTheta);
	float cosTheta = cos(sampleTheta);
	vec4 kern = vec4(cosTheta, sinTheta, -sinTheta, cosTheta) * psize.xyxy;

	#define ZERO vec4(0.0,0.0,0.0,0.0)	
	background += texture2DLod( tRefractionBackground, c - (kern.xy - kern.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c - (kern.xy + ZERO.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c - (kern.xy + kern.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c + (ZERO.xy - kern.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c + (ZERO.xy + kern.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c + (kern.xy - kern.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c + (kern.xy + ZERO.zw), lod ).xyz;
	background += texture2DLod( tRefractionBackground, c + (kern.xy + kern.zw), lod ).xyz;
	background /= 9.0;

	float NdotV = dot( s.normal, s.vertexEye );
	vec3 T1 = vec3(1.0,1.0,1.0) - fresnelSchlick( s.reflectivity, s.fresnel, NdotV );
	vec3 T2 = vec3(1.0,1.0,1.0);
	#ifdef REFLECTION_SECONDARY
		T2 -= fresnelSchlick( s.reflectivitySecondary, s.fresnelSecondary, NdotV );
	#endif
	s.specularLight += T1 * T2 * s.transmissivity * background;
}

#define Transmission	TransmissionRefraction
