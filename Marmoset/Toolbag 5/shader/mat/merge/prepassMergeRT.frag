#include "data/shader/mat/state.frag"
#include "data/shader/scene/raytracing/buffers.comp"

uniform uint uBasePrimitiveID;

#if !defined(PrepassDepthOnly)
	#define USE_OUTPUT1_UINT
	#define USE_OUTPUT2
#endif

void	PrepassMergeRT( inout FragmentState s )
{
	//view space depth
	s.output0.x = s.vertexPosition.z;

#if !defined(PrepassDepthOnly)
	//object ID
	s.output1.x = asfloat( s.objectID+1 );

	//triangleID + barycentrics
	s.output2.x = asfloat( uBasePrimitiveID + s.primitiveID );
	s.output2.y = asfloat( packUnitVec2f( s.triangleBarycentrics.yz ) );
#endif
}

#define  Merge  PrepassMergeRT
