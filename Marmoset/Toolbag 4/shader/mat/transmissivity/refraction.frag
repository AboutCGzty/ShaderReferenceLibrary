//inherits transmissivityBase

#include "data/shader/mat/other/remap.frag"

uniform vec3	uRefractionTint;
uniform uint	uRefractionTintUseAlbedo;

USE_TEXTURE_MATERIAL(tRefractionIORMap);
uniform float	uRefractionIOR;
uniform float	uRefractionMediumIOR;
uniform uint	uRefractionUseReflectivityIOR;
uniform vec4	uRefractionIORSwizzle;

void TransmissivityRefraction( inout FragmentState s )
{
	float t = TransmissivityBase( s );
		
	if( !uRefractionUseReflectivityIOR )
	{
		float i = dot( textureMaterial( tRefractionIORMap, s.vertexTexCoord ), uRefractionIORSwizzle );
		s.eta = remapIORToEta( i * uRefractionIOR, uRefractionMediumIOR );
	}

	#ifdef MATERIAL_PASS_PAINT
		s.transmissivity = vec3(t,t,t);
	#else
		t = sqrt( t ); //square root to make transmissivity more perceptually linear ~ms
		vec3 tint = uRefractionTintUseAlbedo ? s.albedo.rgb*uRefractionTint : uRefractionTint;

		s.transmissivity  = sqrt( tint ); //square root to make tint more perceptually linear ~ms
		s.transmissivity *= t;
		#ifdef MSET_RAYTRACING
			s.diffusion  *= 1.0 - t;
		#endif
	#endif

	#ifndef MATERIAL_PASS_EXPORT
		s.albedo.rgb *= 1.0 - t;
		s.sheen		 *= 1.0 - t;
	#endif

	#ifdef MATERIAL_PASS_EXPORT
		s.generic2.a = t;
	#endif
}

#define Transmissivity	TransmissivityRefraction
