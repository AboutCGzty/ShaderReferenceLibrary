#include "../mat/mesh.comp"
#include "../common/util.sh"
#include "../common/octpack.sh"
#include "brushClip.frag"
#include "hit.frag"

#ifndef BAKE_OUTPUTS
	#define BAKE_OUTPUTS 1
#endif

USE_TEXTURE2D(tIndex);

#ifdef REWRITE_RAY_DATA
	//USE_LOADSTORE_BUFFER(vec4,bRays,BAKE_OUTPUTS);
	//workaround for above macro not expanding correctly in new compiler -jdr

	#if		BAKE_OUTPUTS == 0
		USE_LOADSTORE_BUFFER(vec4,bRays,0);
	#elif	BAKE_OUTPUTS == 1
		USE_LOADSTORE_BUFFER(vec4,bRays,1);
	#elif	BAKE_OUTPUTS == 2
		USE_LOADSTORE_BUFFER(vec4,bRays,2);
	#elif	BAKE_OUTPUTS == 3
		USE_LOADSTORE_BUFFER(vec4,bRays,3);
	#endif
#else
USE_BUFFER(vec4,bRays);
#endif

USE_BUFFER(vec4,bHits);

uniform mat4	uIntersectionMeshTransform;
uniform mat4	uIntersectionMeshInvTranspose;

uniform uint	uIntersectionMeshIndex;
uniform uint	uPixelGangMask;


BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec3,fTangent)
	INPUT2(vec3,fBitangent)
	INPUT3(vec3,fNormal)
	INPUT4(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
	#if BAKE_OUTPUTS > 1
		OUTPUT_COLOR1(vec4)
	#endif
	#if BAKE_OUTPUTS > 2
		OUTPUT_COLOR2(vec4)
	#endif
	#if BAKE_OUTPUTS > 3
		OUTPUT_COLOR3(vec4)
	#endif
END_PARAMS
{
	BakeHit h;
	h.output0 =
	h.output1 =
	h.output2 =
	h.output3 = vec4( 0.0, 0.0, 0.0, 1.0 );

	//load ray index
	uint rayIndex = asuint( imageLoad( tIndex, uint2( IN_POSITION.xy ) ).x );
	bool miss = false;

	// check brush mask
	HINT_BRANCH if( brushClip(fTexCoord) )
	{
		//load hit data
		{
			vec4 hitLoad = bHits[rayIndex];

			//mesh index for hit
			h.hitMeshIndex = asuint( hitLoad.x );
			miss = (h.hitMeshIndex == 0x7FFFFFFF);

			//triangle index and barycentric coords
			h.hitTriangleIndex = asuint( hitLoad.y );
			h.hitBarycenter = saturate( vec3( 1.0-hitLoad.z-hitLoad.w, hitLoad.z, hitLoad.w ) );
		}

		HINT_BRANCH if( h.hitMeshIndex == uIntersectionMeshIndex )
		{
			//load vertex data for the hit location
			{
				uint3 tri = loadTriangle( h.hitTriangleIndex );
				Vertex v0 = loadVertex( tri.x );
				Vertex v1 = loadVertex( tri.y );
				Vertex v2 = loadVertex( tri.z );

				#define INTERPOLATE(attrib) (h.hitBarycenter.x*v0.attrib + h.hitBarycenter.y*v1.attrib + h.hitBarycenter.z*v2.attrib)
				h.hitPosition	= INTERPOLATE(position);
				h.hitNormal		= INTERPOLATE(normal); 
				h.hitTangent	= INTERPOLATE(tangent);
				h.hitBitangent	= INTERPOLATE(bitangent);
				h.hitTexCoord	= INTERPOLATE(texcoord);
				h.hitColor		= INTERPOLATE(color);

				h.hitPosition = mulPoint( uIntersectionMeshTransform, h.hitPosition ).xyz;
				h.hitNormal = normalize( mulVec( uIntersectionMeshInvTranspose, h.hitNormal ) );
				h.hitTangent = normalize( mulVec( uIntersectionMeshInvTranspose, h.hitTangent ) );
				h.hitBitangent = normalize( mulVec( uIntersectionMeshInvTranspose, h.hitBitangent ) );
			}

			//load ray values
			{
				vec4 rayLoad = bRays[rayIndex];

				h.rayOrigin = rayLoad.xyz;
				h.rayDirection = unpackUnitVectorOct( asuint(rayLoad.w) );
				h.rayLength = length( h.hitPosition - h.rayOrigin );
			}

			//load dst mesh values
			{
				h.dstPosition = fPosition;
				h.dstPixelCoord = uint2(IN_POSITION.xy);
				h.dstTexCoord = fTexCoord;
				h.dstTangent = fTangent;
				h.dstBitangent = fBitangent;
				h.dstNormal = fNormal;
			}

			#ifdef Intersection
				Intersection( h );
			#endif

			#ifdef REWRITE_RAY_DATA
			{
				//The bottom 2 bits of x,y,z positions store a 6-bit "gang index"
				//which is useful for selecting ray hemisphere directions in later passes.
				uint gangX = uint(IN_POSITION.x) & uPixelGangMask;
				uint gangY = uint(IN_POSITION.y) & uPixelGangMask;
				uint gangIndex = gangY*(uPixelGangMask+1) + gangX;

				uint x = asuint(h.rayOrigin.x);
				x &= ~uint(3); x |= (gangIndex     ) & 3;

				uint y = asuint(h.rayOrigin.y);
				y &= ~uint(3); y |= (gangIndex >> 2) & 3;

				uint z = asuint(h.rayOrigin.z);
				z &= ~uint(3); z |= (gangIndex >> 4) & 3;

				vec4 rayWrite;
				rayWrite.xyz = vec3( asfloat(x), asfloat(y), asfloat(z) );
				rayWrite.w = asfloat( packUnitVectorOct( h.rayDirection ) );
				bRays[rayIndex] = rayWrite;
			}
			#endif
		}
		else
		{ discard; }
	}
	else
	{ miss = true; }

	if( miss )
	{
		#ifdef REWRITE_RAY_DATA
			bRays[rayIndex] = vec4( asfloat( 0x7FFFFFFF ), 0.0, 0.0, 0.0 );
		#endif
		discard;
	}

	OUT_COLOR0 = h.output0;

	#if BAKE_OUTPUTS > 1
		OUT_COLOR1 = h.output1;
	#endif

	#if BAKE_OUTPUTS > 2
		OUT_COLOR2 = h.output2;
	#endif

	#if BAKE_OUTPUTS > 3
		OUT_COLOR3 = h.output3;
	#endif
}
