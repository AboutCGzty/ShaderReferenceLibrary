//inherits transmissivityBase

USE_TEXTURE_MATERIAL(tThinSurfaceTranslucency);
uniform vec3  uThinSurfaceTranslucency;
uniform uint  uThinSurfaceUseAlbedo;
uniform float uThinSurfaceScatter;

void TransmissivityThinSurface( inout FragmentState s )
{
	float t = TransmissivityBase( s );

	vec3 translucency = textureMaterial( tThinSurfaceTranslucency, s.vertexTexCoord ).rgb;
	translucency *= uThinSurfaceTranslucency;
	if( uThinSurfaceUseAlbedo )
	{ translucency *= s.albedo.rgb; }

	s.transmissivity = translucency * t;
	s.thinScatter	 = uThinSurfaceScatter;
	#ifdef MSET_RAYTRACING
		s.diffusion	*= 1.0 - t;
	#endif
}

#define Transmissivity	TransmissivityThinSurface
