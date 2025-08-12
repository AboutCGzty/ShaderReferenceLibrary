#include "data/shader/mat/state.frag"
#include "../../common/util.sh"

//uniform mat4	uProjectionMatrix;
//uniform mat4	uModelViewInverse;
//uniform mat4	uModelViewProjectionPrev;
//uniform float	uMeshID;

void	PrepassMergeRT( inout FragmentState s )
{
	//view space depth
	s.output0.x = s.vertexPosition.z;

#if 0
	//motion
	vec4 newPos = mulPoint( uProjectionMatrix, s.vertexPosition );
	vec3 newNDC = newPos.xyz / newPos.w;

	// Could have accumulation of error, old Model/View/Projection matrices can be different per frame so this would have to happen.
	vec4 pos = mulPoint( uModelViewInverse, s.vertexPosition );
	vec4 oldPos = mulPoint( uModelViewProjectionPrev, pos.xyz );

	vec3 oldNDC = oldPos.xyz / oldPos.w;

	//current_ndc - previous_ndc
	s.output1.xy = newNDC.xy - oldNDC.xy;
	//reflectivity
	s.output1.z = ( s.reflectivity.x + s.reflectivity.y + s.reflectivity.z ) / 3.0;
	//sum of derivative of normal
	s.output1.w = s.gloss;

	//mesh ID for denoising
	s.output2.x = uMeshID;
#endif
}

#define	Merge	PrepassMergeRT