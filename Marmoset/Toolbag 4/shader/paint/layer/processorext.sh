//Usage: 
//define PROCESSOR_NAME	AmbOcc
//define PROCESSOR_FUNC	foo
//include "processor.sh"

//define PROCESSOR_NAME  Dir
//define PROCESSOR_FUNC	bar
//include "processor.sh"
//...
//processAmbOcc( texCoord );
//processDir( texCoord );

#ifndef PROCESSOR_NAME
	#define PROCESSOR_NAME Undefined
#endif

#ifndef PROCESSOR_FUNC
	float procPassThrough( vec4 texel ) { return texel.r; }
	#define PROCESSOR_FUNC procPassThrough 
#endif

#ifndef PROCESSOR_VAR
	#define NAMEIT(x,y) x ## y
	#define PROCESSOR_VAR(x,y) NAMEIT(x,y)
#endif

#define procTexture			PROCESSOR_VAR(t,PROCESSOR_NAME)
#define procInvert			PROCESSOR_VAR(uInvert,PROCESSOR_NAME)
#define procIntensity		PROCESSOR_VAR(uIntensity,PROCESSOR_NAME)
#define procContrast		PROCESSOR_VAR(uContrast,PROCESSOR_NAME)
#define procContrastCenter	PROCESSOR_VAR(uContrastCenter,PROCESSOR_NAME)
#define procBlurOrSharp		PROCESSOR_VAR(uBlurOrSharp,PROCESSOR_NAME)
#define procSharpness		PROCESSOR_VAR(uSharpness,PROCESSOR_NAME)
#define procFilter			PROCESSOR_VAR(uFilter,PROCESSOR_NAME)
#define procRadius			PROCESSOR_VAR(uRadius,PROCESSOR_NAME)
#define procLOD				PROCESSOR_VAR(uLOD,PROCESSOR_NAME)

#include "gaussian.sh"

USE_TEXTURE2D( procTexture );
uniform float	procInvert;
uniform float	procIntensity;
uniform float	procContrast;
uniform float	procContrastCenter;
uniform float	procBlurOrSharp;
uniform float	procSharpness;
uniform vec2	procFilter;
uniform float 	procRadius;
uniform float	procLOD;

#define processNAME			PROCESSOR_VAR(process,PROCESSOR_NAME)
float processNAME (vec2 texCoord)
{
	const vec2 aspect_r = vec2(procRadius, procRadius); 	//@@@ ???: how come this doesnt need an aspect ratio? Are the UVs NOT [0,0-1,1]?
	const vec2 aspect_h = 0.866 * aspect_r;

	float origin = 0.0;
	float sum = 0.0;
	float sum_w = 0.0;		

	vec4 texel = texture2D( procTexture, texCoord );
	origin = PROCESSOR_FUNC( texel );
	origin = (origin - procContrastCenter) * procContrast + procContrastCenter;
	origin = saturate(origin);

	const vec2 hexagon[] = {
		vec2( 1.0, 0.0 ),
		vec2( 0.5, 0.866 ),
		vec2(-0.5, 0.866 ),
		vec2(-1.0, 0.0 ),
		vec2(-0.5,-0.866 ),
		vec2( 0.5,-0.866 ),
	};

	//TODO: consider pound-define or a variable-length loop. The latter might be better because we cant be spawning shader combos in the fill effect
	if( procSharpness < 0.0 )
	{
		//center
		{
			texel = texture2DLod( procTexture, texCoord, procLOD );
			sum += PROCESSOR_FUNC( texel );
			sum_w += 1.0;
		}
		//inner hexel	
		{
			HINT_UNROLL
			for( int i=0; i<6; ++i )			
			{
				vec2 uv_d = 0.5 * aspect_r * hexagon[i];
				texel = texture2DLod( procTexture, texCoord + uv_d, procLOD );
				sum += PROCESSOR_FUNC( texel );
			}
			sum_w += 6.0;
		}
		//off-kilter hexel	
		{
			HINT_UNROLL
			for( int i=0; i<6; ++i )			
			{
				vec2 uv_d = aspect_r * hexagon[i].yx;
				texel = texture2DLod( procTexture, texCoord + uv_d, procLOD );
				sum += PROCESSOR_FUNC( texel );
			}
			sum_w += 6.0;
		}
	}
	
	//outer hexel	
	{
		HINT_UNROLL
		for( int i=0; i<6; ++i )			
		{
			vec2 uv_d = aspect_r * hexagon[i];
			texel = texture2DLod( procTexture, texCoord + uv_d, procLOD );
			sum += PROCESSOR_FUNC( texel );
		}
		sum_w += 6.0;
	}
	sum /= sum_w;
	sum = saturate( (sum - procContrastCenter) * procContrast + procContrastCenter );
	sum = saturate( (sum + procFilter.y) * procFilter.x );
	
	float sharp = saturate( origin + (origin - sum) * procSharpness );
	sum = mix( sum, sharp, procBlurOrSharp );
	
	//Intensity
	sum = mix( sum, 1.0-sum, procInvert );
	sum = mix( 0.0, sum, procIntensity );
	return sum;
}

#undef procTexture
#undef procInvert
#undef procIntensity
#undef procIntensity
#undef procContrast
#undef procContrast
#undef procContrastCenter
#undef procBlurOrSharp
#undef procSharpness
#undef procFilter
#undef procRadius
#undef procLOD

//Only good for one round of include
#undef PROCESSOR_FUNC
#undef PROCESSOR_NAME