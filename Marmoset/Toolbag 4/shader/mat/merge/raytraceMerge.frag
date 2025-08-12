#include "data/shader/mat/state.frag"

void	RaytraceMerge( inout FragmentState s )
{
	s.albedo.rgb	 *= saturate( 1.0 - s.metalness ) * s.diffusion;
	s.sheen			 *= saturate( 1.0 - s.metalness ) * s.diffusion;
	s.transmissivity *= saturate( 1.0 - s.metalness );

	s.output0.xyz	= s.emissiveLight;
	s.output0.w		= s.albedo.a;

	#ifndef ReflectionSample
		s.gloss = 0.0;
	#endif
	#ifndef ReflectionSampleSecondary
		s.glossSecondary = 0.0;
	#endif
}

void	RaytraceMergeUnlit( inout FragmentState s )
{
	s.output0		= s.albedo;
}

#ifdef Unlit
	#define	Merge	RaytraceMergeUnlit
#else
	#define	Merge	RaytraceMerge
#endif
