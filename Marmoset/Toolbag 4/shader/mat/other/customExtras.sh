#ifndef MSET_CUSTOM_EXTRAS_H
#define MSET_CUSTOM_EXTRAS_H

#ifdef INPUT_VERTEXID
	//renaming needed for vertex shaders; ignore these
	#define uCustomScreenSize		uCustomScreenSizeVP
	#define uCustomTime				uCustomTimeVP
	#define uCustomAnimationTime	uCustomAnimationTimeVP
	#define uCustomSeed				uCustomSeedVP
	#define uCustomCameraPosition	uCustomCameraPositionVP
#endif

//useful values for custom shaders
uniform vec2	uCustomScreenSize;			// Screen dimensions, in pixels
uniform float	uCustomTime;				// Clock time since Toolbag was launched (always running)
uniform float	uCustomAnimationTime;		// Animation time; will follow the animation timeline progress
uniform int		uCustomSeed;				// A random-ish value that is unique for each mesh
uniform vec3	uCustomCameraPosition;		// Camera position, in world space

uniform mat4	uCustomShadingToModel;		// Transforms from shading to model space.
uniform mat4	uCustomShadingToWorld;		// Transforms from shading to world space.

#endif
