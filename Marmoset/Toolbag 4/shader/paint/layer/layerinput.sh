#ifndef LAYER_INPUT_SH
#define LAYER_INPUT_SH

#ifdef INPUT_AO
USE_TEXTURE2D(tInputAO);
#endif

#ifdef INPUT_CURVATURE
USE_TEXTURE2D(tInputCurvature);
#endif

#ifdef INPUT_THICKNESS
USE_TEXTURE2D(tInputThickness);
#endif

#ifdef INPUT_NORMAL
USE_TEXTURE2D(tInputNormal);
uniform vec3  uInputNormalScale;
uniform vec3  uInputNormalBias;
#endif

#ifdef INPUT_NORMAL_OBJECT
USE_TEXTURE2D(tInputNormalObject);
uniform vec3	uInputNormalObjectScale;
uniform vec3	uInputNormalObjectBias;
#endif

#ifdef INPUT_CAVITY
USE_TEXTURE2D(tInputCavity);
#endif

// OLD API //

#ifdef INPUT_NORMAL
vec3 sampleInputNormal( vec2 uv ) 
{
	vec3 tap = texture2D( tInputNormal, uv ).xyz;
	tap = (tap * uInputNormalScale) + uInputNormalBias;
	return tap;
}
#endif

#ifdef INPUT_NORMAL_OBJECT
vec3 sampleInputNormalObject( vec2 uv ) 
{
	vec3 tap = texture2D( tInputNormalObject, uv ).xyz;
	tap = (tap * uInputNormalObjectScale) + uInputNormalObjectBias;
	return tap;
}
#endif

// NEW API //

struct InputState
{
	vec4	normal;
	vec4	normalObject;
	vec4	occlusion;
	vec4	thickness;
	vec4	curvature;
	vec4	cavity;
};

InputState	getEmptyInputState()
{
	InputState state;
	state.normal =			vec4(0.0, 0.0, 1.0, 0.0);
	state.normalObject =	vec4(0.0, 0.0, 1.0, 0.0);
	state.occlusion =		vec4(1.0, 1.0, 1.0, 0.0);
	state.thickness =		vec4(1.0, 1.0, 1.0, 0.0);
	state.curvature =		vec4(0.5, 0.5, 0.5, 0.0);
	state.cavity =			vec4(1.0, 1.0, 1.0, 0.0);
	return state;
}

InputState	getInputState( vec2 sampleCoord )
{
	InputState state = getEmptyInputState();

	#ifdef INPUT_AO
		state.occlusion = texture2D( tInputAO, sampleCoord ).rrra;		
	#endif
	
	#ifdef INPUT_CURVATURE
		state.curvature = texture2D( tInputCurvature, sampleCoord ).rrra;
	#endif
	
	#ifdef INPUT_THICKNESS
		state.thickness = texture2D( tInputThickness, sampleCoord ).rrra;
	#endif

	vec4 tap;
	#ifdef INPUT_NORMAL
		tap = texture2D( tInputNormal, sampleCoord );
		state.normal.xyz = (tap.xyz * uInputNormalScale) + uInputNormalBias;
		state.normal.a = tap.a;
		//TODO: uInputLeftHandedNormals?		
	#endif

	#ifdef INPUT_NORMAL_OBJECT
		tap = texture2D( tInputNormalObject, sampleCoord );
		state.normalObject.xyz = (tap.xyz * uInputNormalObjectScale) + uInputNormalObjectBias;
		state.normalObject.a = 1.0;
	#endif

	#ifdef INPUT_CAVITY
		state.cavity = texture2D( tInputCavity, sampleCoord ).rrra;
	#endif

	return state;
}

#endif
