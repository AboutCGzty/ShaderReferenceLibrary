#include "data/shader/common/util.sh"
#include "data/shader/mat/fresnel.frag"
#include "data/shader/mat/other/remap.frag"

USE_TEXTURE2D(tThinSurfaceBackground);

uniform mat4	uThinSurfaceViewProjection;
uniform vec2	uThinSurfacePixelSize; // { 1/w, 1/h }
uniform float	uThinSurfaceMaxLOD;
uniform float	uThinSurfaceDither;

uniform vec4	uThinSurfaceSH[9];

void	TransmissionThinSurface( inout FragmentState s )
{
	//sample the background
	
	vec3 d = s.vertexPosition;
	
	vec4 proj = mulPoint( uThinSurfaceViewProjection, d );
	vec2 c = proj.xy / proj.w;
	#ifdef RENDERTARGET_Y_DOWN
		c.y = -c.y;
	#endif
	c = 0.5*c + vec2(0.5,0.5);

	float lod = uThinSurfaceMaxLOD - uThinSurfaceMaxLOD * (s.gloss * s.gloss * 0.75);
	
	float scatterLod = uThinSurfaceMaxLOD * (0.5 * s.thinScatter);
	lod = max(lod, scatterLod);	 

	
	//background blur samples
	vec2 psize = uThinSurfacePixelSize * exp2(lod) * saturate(lod) * 0.5;

	vec2 K = vec2( 23.14069263277926, 2.665144142690225 );
	float rnd = fract( cos( dot(vec2(s.screenCoord),K) ) * 12345.6789 );
	float sampleTheta = (2.0 * 3.141593) * rnd * uThinSurfaceDither;
	float sinTheta = sin(sampleTheta);
	float cosTheta = cos(sampleTheta);
	vec4 kern = vec4(cosTheta, sinTheta, -sinTheta, cosTheta) * psize.xyxy;
	
	#define ZERO vec4(0.0, 0.0, 0.0, 0.0)
	
	vec3 background = texture2DLod( tThinSurfaceBackground, c, lod ).xyz;	
	background += texture2DLod( tThinSurfaceBackground, c - (kern.xy - kern.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c - (kern.xy + ZERO.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c - (kern.xy + kern.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c + (ZERO.xy - kern.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c + (ZERO.xy + kern.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c + (kern.xy - kern.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c + (kern.xy + ZERO.zw), lod ).xyz;
	background += texture2DLod( tThinSurfaceBackground, c + (kern.xy + kern.zw), lod ).xyz;
	background /= 9.0;

	float NdotV = dot( s.normal, s.vertexEye );
	vec3 T1 = vec3(1.0,1.0,1.0) - fresnelSchlick( s.reflectivity, s.fresnel, NdotV );
	vec3 T2 = vec3(1.0,1.0,1.0);
	#ifdef REFLECTION_SECONDARY
		T2 -= fresnelSchlick( s.reflectivitySecondary, s.fresnelSecondary, NdotV );
	#endif

	//diffuse blur from spherical harmonics
	vec3 H = -s.normal;

	//l = 0 band
	vec3 diff = uThinSurfaceSH[0].xyz;

	//l = 1 band
	diff += uThinSurfaceSH[1].xyz * H.y;
	diff += uThinSurfaceSH[2].xyz * H.z;
	diff += uThinSurfaceSH[3].xyz * H.x;

	//l = 2 band
	vec3 swz = H.yyz * H.xzx;
	diff += uThinSurfaceSH[4].xyz * swz.x;
	diff += uThinSurfaceSH[5].xyz * swz.y;
	diff += uThinSurfaceSH[7].xyz * swz.z;

	vec3 sqr = H*H;
	diff += uThinSurfaceSH[6].xyz * ( 3.0*sqr.z - 1.0 );
	diff += uThinSurfaceSH[8].xyz * ( sqr.x - sqr.y );

	//apply smoke & add
	background = mix( background, diff, s.thinScatter );	
	s.specularLight += T1 * T2 * s.transmissivity * background;

	//conserve energy, if transmission is scattering into the specular term, diffuseLight is computed by other subroutines
	float diffusion = 1.0 - TransmissivityBase( s ); 
	s.diffuseLight *= diffusion;
}

#define Transmission	TransmissionThinSurface
