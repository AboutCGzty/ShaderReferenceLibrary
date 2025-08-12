//old shader, needs conversion to new bake system. -jdr

#include "utils.frag"
#include "brushClip.frag"
#include "dither.frag"
#include "traceRay.frag"
#define TRACERAY_SECONDARY
#define TRACERAY_ANY
#include "traceRay.frag"
#include "../mat/fresnel.frag"
#include "../mat/other/lightParams.frag"
#include "../common/util.sh"

#define	MAX_LIGHTS	48

uniform int		uLightCount;
uniform int		uLightShadowCount;
uniform vec4	uLightPosition[MAX_LIGHTS];		// { x, y, z, directional ? 0 : 1 }
uniform vec3	uLightColor[MAX_LIGHTS];		// { r, g, b }
uniform vec4    uLightX[MAX_LIGHTS];			// x,y,z, cos(spotAngle/2)
uniform vec4    uLightY[MAX_LIGHTS];			// x,y,z, spotSharpness
uniform vec4	uLightSize[MAX_LIGHTS];			// { x, y, z, cos(spotAngle/2) }, z is 'radius'
uniform int		uEnabledShadows[MAX_LIGHTS];	
uniform vec3	uLightSpaceCameraPosition;
uniform vec4	uDiffuseLightSphere[9];
uniform mat4	uSkyboxTransform;
uniform int		uSkyboxEnabled[2];
uniform float	uGGXBrightness;
uniform float	uDitherScale[2];

USE_TEXTURECUBE(tReflectionCubeMap);
USE_BUFFER(vec3,uNormals);
USE_TEXTURE2D(tGlossMap);
USE_TEXTURE2D(tSpecularMap);

#define TAU 6.283185

vec3	diffusionEnv( vec3 normal, mat4 rot )
{
	vec3 n = normal;
	n = mulPoint(rot, n).xyz;
	vec3 ediff = uDiffuseLightSphere[0].xyz;

	//l = 1 band
	ediff += uDiffuseLightSphere[1].xyz * n.y;
	ediff += uDiffuseLightSphere[2].xyz * n.z;
	ediff += uDiffuseLightSphere[3].xyz * n.x;

	//l = 2 band
	vec3 swz = n.yyz * n.xzx;
	ediff += uDiffuseLightSphere[4].xyz * swz.x;
	ediff += uDiffuseLightSphere[5].xyz * swz.y;
	ediff += uDiffuseLightSphere[7].xyz * swz.z;

	vec3 sqr = n * n;
	ediff += uDiffuseLightSphere[6].xyz * ( 3.0*sqr.z - 1.0 );
	ediff += uDiffuseLightSphere[8].xyz * ( sqr.x - sqr.y );

	return ediff;
}

vec3	ImportanceSampleGGX( vec4 r, float a2 )
{
	float cosTheta = sqrt( (1.0 - r.x) / ((a2 - 1.0) * r.x + 1.0) );
	float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
	float cosPhi = r.z;
	float sinPhi = r.w;
	return vec3( cosPhi*sinTheta, sinPhi*sinTheta, cosTheta );
}

float	G_Smith( float a2, float Cos )
{
	return (2.0 * Cos) / (Cos + sqrt(a2 + (1.0 - a2) * (Cos * Cos)));
}

#define GGX_IMPORTANCE_SAMPLES 34
vec3	specularEnv(vec3 normal, vec3 eye, float gloss, vec3 reflectivity, mat4 rot)
{
	float roughness = 1.0 - gloss;
	float a = max( roughness * roughness, 5e-4 );
	float a2 = a*a;
	float k = a * 0.5;
	vec3 n = normal;
	
	//sample the reflection map repeatedly, with an importance-based sample distribution
	vec3 basisX = normalize( cross( n, vec3(0.0, 12.0, n.y) ) );
	vec3 basisY = cross( basisX, n );
	vec3 basisZ = n;
	vec3 spec = vec3(0.0, 0.0, 0.0);

	HINT_UNROLL
	for( int i=0; i<GGX_IMPORTANCE_SAMPLES; ++i )
	{
		vec2 rnd = rand2(float(i));
		vec4 r = vec4(rnd.x, rnd.y, cos(TAU * rnd.y), sin(TAU * rnd.y));
		vec3 dir = ImportanceSampleGGX( r, a2 );
		vec3 H = dir.x*basisX + dir.y*basisY + dir.z*basisZ;
		vec3 L = (2.0 * dot( eye, H )) * H - eye;
		
		float NdotH = saturate( dot( n, H) );
		float NdotL = saturate( dot( n, L) );
		float NdotV = saturate( dot( n, eye) );
		float VdotH = saturate( dot( eye, H) );
		
		float d = ( NdotH * a2 - NdotH ) * NdotH + 1.0;
		float pdf = ( NdotH * a2 ) / (4.0 * 3.141593 * d*d * VdotH);

		float lod = (0.5 * log2( (256.0*256.0)/float(GGX_IMPORTANCE_SAMPLES) ) + 1.5*gloss*gloss) - 0.5*log2( pdf );

		vec3 sampleCol = textureCubeLod( tReflectionCubeMap, mulPoint(rot, L).xyz, lod ).xyz;

		float G = (G_Smith(a2, NdotL) * G_Smith(a2, max(1e-8,NdotV)));
		G *= VdotH / (NdotH * max(1e-8,NdotV));
		vec3 F = fresnelSchlick( reflectivity, vec3(1.0,1.0,1.0), VdotH );

		spec += sampleCol * F * (G * (1.0/float(GGX_IMPORTANCE_SAMPLES)));
	}
	spec *= uGGXBrightness;

	return spec;
}

BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec3,fTangent)
	INPUT2(vec3,fBitangent)
	INPUT3(vec3,fNormal)
	INPUT4(vec2,fTexCoord)
	INPUT5(vec3,fBakeDir)

	OUTPUT_COLOR0(vec4)
	OUTPUT_COLOR1(vec4)
END_PARAMS
{
	//diffuse light
	OUT_COLOR0.xyz = vec3( 0.0, 0.0, 0.0 );
	OUT_COLOR0.w = 0.0;

	//specular light
	OUT_COLOR1.xyz = vec3( 0.0, 0.0, 0.0 );
	OUT_COLOR1.w = 0.0;

	vec3 traceDir = findTraceDirection( fPosition, normalize(fBakeDir), fTexCoord );
	vec3 tracePos = findTraceOrigin( fPosition, traceDir, fTexCoord );

	TriangleHit hit;
	bool didhit = traceRay( tracePos, traceDir, hit );

	if( didhit )
	{
		vec3 diffLight = vec3(0.0, 0.0, 0.0);
		vec3 specLight = vec3(0.0, 0.0, 0.0);

		vec3 position = tracePos + hit.distance * traceDir;
		vec3 normal =	hit.coords.x * uNormals[hit.vertices.x] +
						hit.coords.y * uNormals[hit.vertices.y] +
						hit.coords.z * uNormals[hit.vertices.z];
		normal = normalize(normal);

		// Material Info
		vec4 glossMap = texture2D( tGlossMap, fTexCoord );
		float gloss = glossMap.x;
		float roughness = 1.0 - gloss;
		vec3 reflectivity = texture2D( tSpecularMap, fTexCoord ).xyz;
		vec3 eye = normalize(uLightSpaceCameraPosition - position);

		// Environment
		vec3 diffEnv = uSkyboxEnabled[0] > 0 ? diffusionEnv(normal, uSkyboxTransform) : vec3( 0.0, 0.0, 0.0 );
		vec3 specEnv = uSkyboxEnabled[1] > 0 ? specularEnv(normal, eye, gloss, reflectivity, uSkyboxTransform) : vec3( 0.0, 0.0, 0.0 );

		// Lights
		for( int i = 0; i < uLightCount; ++i )
		{
			//initialize lights
			LightParams p;
			vec4 lightpos = uLightPosition[i];
			p.toSource.xyz = lightpos.xyz - position * lightpos.w;
			p.toSource.w = lightpos.w;
			p.invDistance = rsqrt( dot( p.toSource.xyz, p.toSource.xyz ) );
			p.distance = rcp( p.invDistance );
			p.direction = p.toSource.xyz * p.invDistance;
			p.attenuation = p.toSource.w ? (p.invDistance * p.invDistance) : 1.0;

			vec4 lightSizeLoad = uLightSize[i];
			p.size = lightSizeLoad.xyz;
			p.axisX = uLightX[i].xyz;
			p.axisY = uLightY[i].xyz;
			p.spotParams.x = uLightX[i].w;
			p.spotParams.y = uLightY[i].w;
			p.color = uLightColor[i];
			p.id = float(i);
			p.shadow = vec4(1.0, 1.0, 1.0, 1.0);
			
			//shadows
			if( uEnabledShadows[i] > 0 )
			{
				vec2 lightSize = p.size.xy + p.size.zz;
				vec3 spos = position + normal * 0.001;
				float shadow = 0.0;
				float rngSeed = fTexCoord.x + fTexCoord.y * 3999.0 + p.id;

				#define SHADOW_SAMPLES 25
				for( int i=0; i<SHADOW_SAMPLES; ++i )
				{
					vec2 offset = rand2( rngSeed + float(i) );
					offset = 2.0*offset - vec2(1.0,1.0);
					offset *= lightSize;
					vec3 lpos = lightpos.xyz + offset.x * p.axisX + offset.y * p.axisY;
					vec3 toLight = mix( p.toSource.xyz, normalize(lpos-position), lightpos.w );

					TriangleHit shadowHit;
					if( traceRay2( spos, toLight, shadowHit ) )
					{
						if( lightpos.w <= 0.0 || shadowHit.distance < p.distance )
						{ shadow += 1.0/float(SHADOW_SAMPLES); }
					}
				}
				shadow = 1.0 - shadow;
				p.shadow = vec4( shadow, shadow, shadow, shadow );
			}
			
			//diffuse
			adjustAreaLightDiffuse( p, position );
			float lambert = saturate( ( 1.0 / 3.1415926 ) * dot( normal, p.direction ) );
			diffLight += lambert * p.attenuation * p.color * p.shadow.rgb;

			//specular
			float a = max( roughness * roughness, 2e-4 );
			float a2 = a * a;
			adjustAreaLightSpecular( p, reflect( -eye, normal ), rcp( 3.141592 * a2 ) );

			//various dot products
			vec3 H = normalize( p.direction + eye );
			float NdotH = saturate( dot( normal, H ) );
			float VdotN = saturate( dot( eye, normal ) );
			float LdotN = saturate( dot( p.direction, normal ) );
			float VdotH = saturate( dot( eye, H ) );
		
			//incident light
			vec3 spec = p.color * p.shadow.rgb * p.attenuation * LdotN;
		
			//microfacet distribution
			float d = ( NdotH * a2 - NdotH ) * NdotH + 1.0;
			d *= d;
			float D = a2 / (3.141593 * d);

			//geometric / visibility
			float k = a * 0.5;
			float G_SmithL = LdotN * (1.0 - k) + k;
			float G_SmithV = VdotN * (1.0 - k) + k;
			float G = 0.25 / ( G_SmithL * G_SmithV );

			//fresnel
			vec3 F = reflectivity + ( vec3(1.0,1.0,1.0) - reflectivity ) * exp2( ( -5.55473 * VdotH - 6.98316 ) * VdotH );
		
			//final
			if( dot(normal, eye) >  0.01 )
			{
				specLight += max( vec3(0.0, 0.0, 0.0), (D * G) * (F * spec) );
			}
		}

		vec3 diffusion = diffEnv + diffLight;
		vec3 specular = specEnv + specLight;

		if( uDitherScale[0] > 0.0 )
		{ diffusion = dither8bit( diffusion, floor(IN_POSITION.xy * uDitherScale[0]) ); }

		if( uDitherScale[1] > 0.0 )
		{ specular = dither8bit( specular, floor(IN_POSITION.xy * uDitherScale[1]) ); }

		//diffuse light
		OUT_COLOR0.xyz = diffusion;
		OUT_COLOR0.w = 1.0;

		//specular light
		OUT_COLOR1.xyz = specular;
		OUT_COLOR1.w = 1.0;
	}
}
