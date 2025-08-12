#ifndef MSET_MAT_VALUES_FRAG
#define MSET_MAT_VALUES_FRAG

struct	MatValues
{
	vec3	albedo;
	vec3	baseColor;
	float	metalness;
	float	gloss;
	float	roughness;
	vec3	specular;
	vec3	emissive;
	float	alpha;
};

uniform vec4	uMatTexCoordScaleBias;

USE_TEXTURE2D(tSourceAlbedo);
uniform vec3	uAlbedoMask;
uniform int		uUseVertexColor;

USE_TEXTURE2D(tSourceGloss);
uniform vec2	uGlossScaleBias;
uniform vec4	uGlossMask;

USE_TEXTURE2D(tSourceSpecular);
uniform vec4	uSpecularMask;
uniform vec3	uSpecularColor;
uniform int		uSpecIsMetal;
uniform int		uSpecMetalInvert;
uniform float	uMetalnessThreshold;

USE_TEXTURE2D(tSourceEmissive);
uniform vec3	uEmissiveMask;
uniform int		uEmissiveType;
uniform vec3	uEmissiveAdd;
USE_TEXTURE2D(tEmissiveHeatSpectrum);
uniform vec3	uEmissiveHeatRange;

USE_TEXTURE2D(tSourceAlpha);
uniform vec4	uAlphaMask;

MatValues	sampleMaterialValues( vec2 texcoord, vec4 vertexColor )
{
	MatValues r;
	vec2 tc = texcoord * uMatTexCoordScaleBias.xy + uMatTexCoordScaleBias.zw;

	//input textures
	vec4 albedoTex = texture2DLod( tSourceAlbedo, tc, 0.0 );
	vec4 reflectiveTex = texture2DLod( tSourceSpecular, tc, 0.0 );
	vec4 microsurfaceTex = texture2DLod( tSourceGloss, tc, 0.0 );

	//albedo (specular)
	vec3 albedos = albedoTex.xyz;
	albedos *= uAlbedoMask;
	if( uUseVertexColor )
	{
		albedos *= vertexColor.xyz;
	}

	if( uSpecIsMetal )
	{
		//convert metalness albedo to specular albedo
		float metalness = dot(reflectiveTex, uSpecularMask);
		if( uSpecMetalInvert )
		{ metalness = 1.0 - metalness; }
		albedos = mix(albedos, vec3(0.0, 0.0, 0.0), metalness);
	}
	r.albedo = albedos;

	//gloss
	float gloss = dot(microsurfaceTex, uGlossMask);
	gloss = uGlossScaleBias.x * gloss + uGlossScaleBias.y;
	r.gloss = gloss;
	
	//specular
	vec3 spec = reflectiveTex.rgb;
	float metalness = reflectiveTex.r;
	if( uSpecIsMetal )
	{
		//convert metalness into specular
		metalness = dot(reflectiveTex, uSpecularMask);
		if( uSpecMetalInvert )
		{ metalness = 1.0 - metalness; }

		vec3 albedom =  albedoTex.rgb;
		albedom *= uAlbedoMask;
		if( uUseVertexColor )
		{
			albedom *= vertexColor.xyz;
		}
		
		spec = mix( vec3(0.04,0.04,0.04), albedom, metalness );
	}
	else
	{
		if( uSpecularMask.r == 1.0 && uSpecularMask.g != 1.0 )
		{
			float specChan = dot(reflectiveTex, uSpecularMask);
			spec = vec3(specChan, specChan, specChan);
		}
		spec *= uSpecularColor;
	}
	r.specular = spec;

	//albedo (metalness)
	vec3 albedom =  albedoTex.rgb;
	if( !uSpecIsMetal )
	{
		//convert albedo specular to albedo metalness
		float specAvg = ( spec.r + spec.g + spec.b ) / 3.0;
		
		vec3 diffSpec = vec3(
			specAvg >= uMetalnessThreshold ? spec.r : 0.0,
			specAvg >= uMetalnessThreshold ? spec.g : 0.0,
			specAvg >= uMetalnessThreshold ? spec.b : 0.0
			);

		albedom = saturate((albedos + diffSpec) - albedos * diffSpec);
	}
	else
	{
		albedom *= uAlbedoMask;
		if( uUseVertexColor )
		{
			albedom *= vertexColor.xyz;
		}
	}
	r.baseColor = albedom;

	//roughness
	r.roughness = 1.0 - r.gloss;

	//metalness
	metalness = reflectiveTex.r;
	if( !uSpecIsMetal )
	{
		//convert specular to metalness
		float specAvg = ( spec.r + spec.g + spec.b ) / 3.0;
		vec3 coloredMetal = (saturate(specAvg - vec3(0.04, 0.04, 0.04)) / saturate(albedos + vec3(.04, .04, .04))) / .96;
		metalness = saturate( coloredMetal.x );
	}
	else
	{
		metalness = dot(reflectiveTex, uSpecularMask);
	}
	r.metalness = metalness;

	//emissive
	vec3 emissive = texture2DLod( tSourceEmissive, tc, 0.0 ).xyz;
	vec3 emit = emissive * uEmissiveMask + uEmissiveAdd;
	
	//heat
	if( uEmissiveType == 1 )
	{
		float temp = mix( uEmissiveHeatRange.x, uEmissiveHeatRange.y, emissive.x );
		float mireds = 1000.0 / temp; //actually mireds divided by 1000

		float intensity = saturate( temp / 10000.0 );
		intensity *= intensity;
		intensity *= uEmissiveHeatRange.z;

		emit = intensity * texture2D( tEmissiveHeatSpectrum, vec2( mireds, 0.0 ) ).rgb;
	}
	r.emissive = emit;

	//transparency
	vec4 alpha = texture2DLod( tSourceAlpha, tc, 0.0 );
	vec4 alphavec = alpha * uAlphaMask;
	if( uUseVertexColor )
	{
		alphavec *= vertexColor.a;
	}
	r.alpha = max(max(max(alphavec.x, alphavec.y), alphavec.z), alphavec.w);

	return r;
}

#endif