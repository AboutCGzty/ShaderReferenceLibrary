#include "state.frag"
#include "other/remap.frag"

uniform vec4	uLightSpaceCameraPosition;
uniform vec4	uScreenTexCoordScaleBias;

//executes all material subroutines aside from premerge and merge
void runSubroutines( inout FragmentState state )
{
	#ifdef Displacement
		Displacement(state);
	#endif

	#ifdef Surface
		Surface(state);
	#endif

	#ifdef Microsurface
		Microsurface(state);
	#endif
	#ifdef MicrosurfaceSecondary
		MicrosurfaceSecondary(state);
	#endif

	#ifdef Albedo
		Albedo(state);
	#endif
	
	#ifdef Sheen
		Sheen(state);
	#endif
	
	#ifdef Reflectivity
		Reflectivity(state);
	#endif
	#ifdef ReflectivitySecondary
		ReflectivitySecondary(state);
	#endif
	
	#ifdef Transmissivity
		Transmissivity(state);
	#endif

	#ifdef Lighting
		Lighting(state);
	#else
		#ifdef Diffusion
			Diffusion(state);
		#endif
		#ifdef Reflection
			Reflection(state);
		#endif
		#ifdef Occlusion
			Occlusion(state);
		#endif
		#ifdef Cavity
			Cavity(state);
		#endif
	#endif

	#ifdef Transmission
		Transmission(state);
	#endif

	#ifdef Emissive
		Emissive(state);
	#endif

	#ifdef Transparency
		Transparency(state);
	#endif
}

BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec4,fColor)
	INPUT2(vec3,fTangent)
	INPUT3(vec3,fBitangent)
	INPUT4(vec3,fNormal)
	INPUT5(vec4,fTexCoord)
	#if defined(VERT_INSTANCING) || defined(GEOM_INSTANCING)
	//should just be int, but metal compiler crashes unless this is int2. OS X 10.12.4. -jdr
	INPUT6(int2,fInstanceID)
	#endif

	OUTPUT_COLOR0(vec4)
	#ifdef USE_OUTPUT1
		OUTPUT_COLOR1(vec4)
	#endif
	#ifdef USE_OUTPUT2
		OUTPUT_COLOR2(vec4)
	#endif
	#ifdef USE_OUTPUT3
		OUTPUT_COLOR3(vec4)
	#endif
	#ifdef USE_OUTPUT4
		OUTPUT_COLOR4(vec4)
	#endif
	#ifdef USE_OUTPUT5
		OUTPUT_COLOR5(vec4)
	#endif
	#ifdef USE_OUTPUT6
		OUTPUT_COLOR6(vec4)
	#endif
	#ifdef USE_OUTPUT7
		OUTPUT_COLOR7(vec4)
	#endif
END_PARAMS
{
	//default state values
	FragmentState state;
	state.vertexPosition = fPosition;
	vec3 eye = uLightSpaceCameraPosition.xyz - uLightSpaceCameraPosition.w*state.vertexPosition;
	state.vertexEye = normalize( eye );
	state.vertexEyeDistance = length( eye );
	state.vertexColor = fColor;
	#ifdef ALWAYS_FRONTFACING
		state.vertexNormal = fNormal;
		state.frontFacing = true;
	#else
		state.vertexNormal = IN_FRONTFACING ? fNormal : -fNormal;
		state.frontFacing = IN_FRONTFACING;
	#endif
	state.vertexTangent = fTangent;
	state.vertexBitangent = fBitangent;
	state.vertexTexCoord = fTexCoord.xy;
	state.vertexTexCoordSecondary = fTexCoord.zw;
	state.screenCoord = uint2( IN_POSITION.xy );
	state.screenTexCoord = IN_POSITION.xy * uScreenTexCoordScaleBias.xy + uScreenTexCoordScaleBias.zw;
	state.screenDepth = IN_POSITION.z;
	state.sampleCoverage = IN_COVERAGE;
	#if defined(VERT_INSTANCING) || defined(GEOM_INSTANCING)
	state.instanceID = fInstanceID.x;
	#else
	state.instanceID = 0;
	#endif
	state.albedo = vec4(1.0,1.0,1.0,1.0);
	state.baseColor = state.albedo.rgb;
	state.normal = normalize( state.vertexNormal );
	state.geometricNormal = normalize( cross( ddy(fPosition), ddx(fPosition) ) );
	state.gloss =
	state.glossSecondary = 0.0;
	state.displacement = 0.0;
	state.curvature = 0.0;
	state.reflectivity = vec3(0.0,0.0,0.0);
	state.reflectivitySecondary = vec3(0.0,0.0,0.0);
	state.fresnel = vec3(1.0,1.0,1.0);
	state.fresnelSecondary = vec3(1.0,1.0,1.0);
	state.sheen = vec3(0.0,0.0,0.0);
	state.sheenRoughness = 0.0;
	state.fuzz = vec3(0.0,0.0,0.0);
	state.fuzzGlossMask = false;
	state.transmissivity = vec3(0.0,0.0,0.0);
	state.thinScatter = 0.0;
	state.eta = MAT_DEFAULT_ETA;
	state.etaSecondary = MAT_DEFAULT_ETA;
	state.metalness = 0.0;
	state.occlusion = 1.0;
	state.cavity = 1.0;
	state.scatterColor = vec3(1.0,1.0,1.0);
	state.anisoTangent = vec3(0.0,1.0,0.0);

	state.diffuseLight =
	state.specularLight =
	state.emissiveLight = vec3(0.0,0.0,0.0);
	state.generic0 =
    state.generic1 =
	state.generic2 =
    state.generic3 = vec4(0.0,0.0,0.0,0.0);
    state.output0 =
	state.output1 =
	state.output2 =
	state.output3 =
	state.output4 =
	state.output5 =
	state.output6 =
	state.output7 = vec4(0.0,0.0,0.0,1.0);

	#if defined(PremergeTriplanar) && defined(MergeTriplanar)
		FragmentState states[3];
		states[0] =
		states[1] =
		states[2] = state;
		vec3 weights = PremergeTriplanar(states[0], states[1], states[2]);
		runSubroutines(states[0]);
		runSubroutines(states[1]);
		runSubroutines(states[2]);
		MergeTriplanar(state, states[0], states[1], states[2], weights);

	#elif defined(PremergePlanar) && defined(MergePlanar)
		PremergePlanar(state);
		runSubroutines(state);
		MergePlanar(state);
		
	#else
		#ifdef Premerge
			Premerge(state);
		#endif

		runSubroutines(state);

		#ifdef Merge
			Merge(state);
		#endif
	#endif

	OUT_COLOR0 = state.output0;

	#ifdef USE_OUTPUT1
		OUT_COLOR1 = state.output1;
	#endif

	#ifdef USE_OUTPUT2
		OUT_COLOR2 = state.output2;
	#endif

	#ifdef USE_OUTPUT3
		OUT_COLOR3 = state.output3;
	#endif

	#ifdef USE_OUTPUT4
		OUT_COLOR4 = state.output4;
	#endif

	#ifdef USE_OUTPUT5
		OUT_COLOR5 = state.output5;
	#endif

	#ifdef USE_OUTPUT6
		OUT_COLOR6 = state.output6;
	#endif

	#ifdef USE_OUTPUT7
		OUT_COLOR7 = state.output7;
	#endif
}
