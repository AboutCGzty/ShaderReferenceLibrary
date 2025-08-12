#include "data/shader/mat/state.frag"

#ifndef USE_OUTPUT1
	#define	USE_OUTPUT1
#endif

#ifndef USE_OUTPUT2
	#define	USE_OUTPUT2
#endif

uniform uint uPrepassRayTraceEnabled;

void	PrepassMergeRTAO( inout FragmentState s )
{
	//normal (packed to preserve sign if ray tracing is enabled because it uses features buffer
    //so in this case it uses bgra8, otherwise in raster for both ao pass and full quality we use
    //rgba16f)
    s.output0.xyz = uPrepassRayTraceEnabled ? s.normal * 0.5 + 0.5 : s.normal;
	s.output0.w = 0.0;

	//view space depth
	s.output1.x = s.vertexPosition.z;

	//view space vertex normal (packed to preserve sign)
	s.output2.xyz = s.vertexNormal.xyz * 0.5 + 0.5;
	s.output2.w = 0.0;
}

#define	Merge	PrepassMergeRTAO
