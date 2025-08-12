/*
    example2.frag

    Tints diffuse lighting results with a set of RGB colors.
    This is a good example of how to extend a lighting function
    (in this case the diffuse lighting).

    For more general custom shader information, see:
	https://www.marmoset.co/posts/toolbag_custom_shaders/
*/

//we only want to alter these passes
#if defined(MATERIAL_PASS_LIGHT)

	#include "../state.frag"
	#include "../other/lightParams.frag"

	uniform float   uCustomBrightness;	//name "Diffusion Brightness"  default 1.0  min 0  max 4
	uniform vec3    uColorEnv;			//color  name "Environment Light Tint"  default 1 1 1
	uniform vec3    uColorDirect;		//color  name "Direct Light Tint"  default 1 1 1

	USE_TEXTURE2D(tDiffuseMask);		//srgb  name "Diffusion Mask"


	//environment diffusion is extended by this function
	void    DiffusionMaskedEnv( inout FragmentState s )
	{
		//invoke the old/existing diffusion function
		#ifdef DiffusionEnv
			DiffusionEnv(s);
		#endif

		//compute mask
		vec3 mask = texture2D( tDiffuseMask, s.vertexTexCoord ).rgb;
		mask *= uColorEnv * uCustomBrightness;

		//apply mask
		s.diffuseLight *= mask;
	}
	#ifdef DiffusionEnv
		#undef DiffusionEnv
	#endif
	#define DiffusionEnv DiffusionMaskedEnv


	//per-light diffusion is extended by this function
	void    DiffusionMasked( inout FragmentState s, LightParams l )
	{
		vec3 old = s.diffuseLight;

		//invoke the old/existing diffusion function
		#ifdef Diffusion
			Diffusion(s,l);
		#endif

		//compute mask
		vec3 mask = texture2D( tDiffuseMask, s.vertexTexCoord ).rgb;
		mask *= uColorDirect * uCustomBrightness;

		//apply mask
		vec3 diff = s.diffuseLight - old;
		s.diffuseLight = old + diff * mask;
	}
	#ifdef Diffusion
		#undef Diffusion
	#endif
	#define Diffusion DiffusionMasked

#endif //passes
