//inherits albedoMap.frag

uniform vec3	uAlbedoVertexColor;
uniform uint	uAlbedoVertexMeshColors;

void	AlbedoVertex( inout FragmentState s )
{
	AlbedoMap(s);
	vec4 vc = uAlbedoVertexMeshColors ? s.vertexColor : vec4(1,1,1,1);

	//sRGB conversion
	vec3 srgb = (vc.xyz*vc.xyz)*(vc.xyz*vec3(0.2848,0.2848,0.2848) + vec3(0.7152,0.7152,0.7152));
	vc.xyz = mix( vc.xyz, srgb, uAlbedoVertexColor.z );

	//color & alpha enables
	s.albedo = mix( s.albedo, s.albedo * vc, uAlbedoVertexColor.xxxy );
	s.baseColor = s.albedo.xyz;
}

#undef	Albedo
#define	Albedo	AlbedoVertex