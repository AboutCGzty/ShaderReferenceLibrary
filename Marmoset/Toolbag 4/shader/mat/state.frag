#ifndef MSET_FRAGMENT_STATE_H
#define MSET_FRAGMENT_STATE_H

struct	FragmentState
{
	//inputs
	vec3	vertexPosition;
	vec3	vertexEye;
	float	vertexEyeDistance;
	vec2	vertexTexCoord;
	vec2	vertexTexCoordSecondary;
	vec4	vertexColor;
	vec3	vertexNormal;
	vec3	vertexTangent;
	vec3	vertexBitangent;
	vec3	geometricNormal;
	uint2	screenCoord;
	vec2	screenTexCoord;
	float	screenDepth;
	uint	sampleCoverage;
	int		instanceID;
	bool	frontFacing;

	//state
	vec4	albedo;
	vec3	baseColor;
	vec3	normal;
	float	displacement;
	float	curvature;
	float	gloss;
	float	glossSecondary;
	vec3	reflectivity;
	vec3	reflectivitySecondary;
	vec3	fresnel;
	vec3	fresnelSecondary;
	vec3	sheen;
	float	sheenRoughness;
	vec3	fuzz;
	bool	fuzzGlossMask;
	vec3	transmissivity;
	float	thinScatter;
	float	eta;
	float	etaSecondary;
	float	metalness;
	vec3	emissiveLight;
	vec3	scatterColor;
	vec3	anisoTangent;

	//raster & painting only
#ifndef MSET_RAYTRACING
	float	occlusion;
	float	cavity;			
	vec3	diffuseLight;
	vec3	specularLight;
#endif

	//ray tracing only
#ifdef MSET_RAYTRACING
	float	diffusion;
	float	skyOcclusion;
	float	reflectionOcclusion;
	vec3	scatterDepth;
	vec3	mediumExtinction;
	vec3	mediumScatter;
	float	mediumAnisotropy;
	bool	shadowCatcherIndirect;
	bool	allowSubsurfaceDiffusion;
#endif

	//generic attributes
	vec4	generic0;
	vec4	generic1;
	vec4	generic2;
	vec4	generic3;

	//final outputs
	vec4	output0;
	vec4	output1;
	vec4	output2;
	vec4	output3;
	vec4	output4;
	vec4	output5;
	vec4	output6;
	vec4	output7;
};

//Shared sampler interface for pixel shader materials.
//This is preferable to the old method of having a sampler state for
//each texture resource, since many GPUs have low sampler count limits.
USE_SAMPLER(sMaterialSampler);
#define	USE_TEXTURE_MATERIAL(tname)	USE_TEXTURE2D_NOSAMPLER(tname)

#ifdef COMPUTE
	#define	textureMaterial(tex,coord)	textureWithSamplerLod( tex, sMaterialSampler, coord, 0.0 )
	#ifdef texture2D
		#undef texture2D
	#endif
	#define	texture2D(t,c)		texture2DLod(t,c,0.0)

	#ifdef texture3D
		#undef texture3D
	#endif
	#define	texture3D(t,c)		texture3DLod(t,c,0.0)

	#ifdef textureCube
		#undef textureCube
	#endif
	#define	textureCube(t,c)	textureCubeLod(t,c,0.0)

	#ifdef discard
		#undef discard
	#endif
	#define	discard	0
#else
	#ifdef FORCE_TEXTURE_MATERIAL_LOD
		#define	textureMaterial(tex,coord)	textureWithSamplerLod( tex, sMaterialSampler, coord, FORCE_TEXTURE_MATERIAL_LOD )
	#else
		#define	textureMaterial(tex,coord)	textureWithSampler( tex, sMaterialSampler, coord )
	#endif
#endif

#endif