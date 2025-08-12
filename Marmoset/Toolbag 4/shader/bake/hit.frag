#ifndef MSET_BAKE_HIT_FRAG
#define MSET_BAKE_HIT_FRAG

struct	BakeHit
{
	vec3	rayOrigin;
	vec3	rayDirection;
	float	rayLength;
	
	vec3	dstPosition;
	uint2	dstPixelCoord;
	vec2	dstTexCoord;
	vec3	dstTangent;
	vec3	dstBitangent;
	vec3	dstNormal;

	uint	hitMeshIndex;
	uint	hitTriangleIndex;
	vec3	hitBarycenter;

	vec3	hitPosition;
	vec2	hitTexCoord;
	vec3	hitTangent;
	vec3	hitBitangent;
	vec3	hitNormal;
	vec4	hitColor;

	vec4	output0,
			output1,
			output2,
			output3;
};

struct	BakePostHit
{
	vec4	rayData;
	vec4	hitData;

	vec3	dstPosition;
	uint2	dstPixelCoord;
	vec2	dstTexCoord;
	vec3	dstTangent;
	vec3	dstBitangent;
	vec3	dstNormal;

	vec4	output0,
			output1,
			output2,
			output3;
};

struct	BakeMiss
{
	vec4	output0,
			output1,
			output2,
			output3;
};

#endif
