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

#ifndef PROCESSOR_TEXTURE_DEFINED
#define PROCESSOR_TEXTURE_DEFINED
	USE_TEXTURE2D( tProcessorTexture );
#endif

#ifndef PROCESSOR_NAME
	#define PROCESSOR_NAME Undefined
#endif

#ifndef PROCESSOR_FUNC
#ifndef PROCESSOR_FUNC_DEFAULT
	float procPassThrough( vec4 texel ) { return texel.r; }
#define	PROCESSOR_FUNC_DEFAULT
#endif
	#define PROCESSOR_FUNC procPassThrough 
#endif

#ifndef PROCESSOR_VAR
	#define NAMEIT(x,y) x ## y
	#define PROCESSOR_VAR(x,y) NAMEIT(x,y)
#endif

#ifndef PROCESSOR_SIMPLE
	#define PROCESSOR_SIMPLE 0
#endif

#define procInvert			PROCESSOR_VAR(uInvert,PROCESSOR_NAME)
#define procIntensity		PROCESSOR_VAR(uIntensity,PROCESSOR_NAME)
#define procContrast		PROCESSOR_VAR(uContrast,PROCESSOR_NAME)
#define procContrastCenter	PROCESSOR_VAR(uContrastCenter,PROCESSOR_NAME)
#define procBlurOrSharp		PROCESSOR_VAR(uBlurOrSharp,PROCESSOR_NAME)
#define procSharpness		PROCESSOR_VAR(uSharpness,PROCESSOR_NAME)
#define procRadius			PROCESSOR_VAR(uRadius,PROCESSOR_NAME)
#define procLOD				PROCESSOR_VAR(uLOD,PROCESSOR_NAME)
#define procGray			PROCESSOR_VAR(uGray,PROCESSOR_NAME)

#include "gaussian.sh"

uniform float	procInvert;
uniform float	procIntensity;
uniform float	procContrast;
uniform float	procContrastCenter;
uniform float	procBlurOrSharp;
uniform float	procSharpness;
uniform float 	procRadius;
uniform float	procLOD;
uniform float	procGray;

#define processNAME			PROCESSOR_VAR(process,PROCESSOR_NAME)
//fast grayscale version
float processNAME (vec2 texCoord)
{
	const vec2 aspect_r = vec2(procRadius, procRadius); 	//@@@ ???: how come this doesnt need an aspect ratio? Are the UVs NOT [0,0-1,1]?
	const vec2 aspect_h = 0.866 * aspect_r;

	float origin = 0.0;
	float sum = 0.0;
	float sum_w = 0.0;		

	vec4 texel = texture2D( tProcessorTexture, texCoord );
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

#if PROCESSOR_SIMPLE
	sum = origin;
#else
	//TODO: consider pound-define or a variable-length loop. The latter might be better because we cant be spawning shader combos in the fill effect
	if( procSharpness < 0.0 )
	{
		//center
		{
			texel = texture2DLod( tProcessorTexture, texCoord, procLOD );
			sum += PROCESSOR_FUNC( texel );
			sum_w += 1.0;
		}
		//inner hexel	
		{
			HINT_UNROLL
			for( int i=0; i<6; ++i )			
			{
				vec2 uv_d = 0.5 * aspect_r * hexagon[i];
				texel = texture2DLod( tProcessorTexture, texCoord + uv_d, procLOD );
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
				texel = texture2DLod( tProcessorTexture, texCoord + uv_d, procLOD );
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
			texel = texture2DLod( tProcessorTexture, texCoord + uv_d, procLOD );
			sum += PROCESSOR_FUNC( texel );
		}
		sum_w += 6.0;
	}
	sum /= sum_w;
	sum = saturate( (sum - procContrastCenter) * procContrast + procContrastCenter );
	float sharp = saturate( origin + (origin - sum) * procSharpness );
	sum = mix( sum, sharp, procBlurOrSharp );
#endif

	//Intensity
	sum = mix( sum, 1.0-sum, procInvert );
	sum = mix( 0.0, sum, procIntensity );

	return sum;
}

#ifndef PROCESSORV4_FUNC
#ifndef PROCESSORV4_FUNC_DEFAULT
	vec4 procPassThroughV4( vec4 texel ) { return texel; }
#define	PROCESSORV4_FUNC_DEFAULT
#endif
	#define PROCESSORV4_FUNC procPassThroughV4 
#endif

#define processV4NAME			PROCESSOR_VAR(processV4,PROCESSOR_NAME)

//vec4/rgba
vec4 processV4NAME (vec2 texCoord)
{
	const vec2 aspect_r = vec2(procRadius, procRadius);
	const vec2 aspect_h = 0.866 * aspect_r;

	vec4 origin = vec4(0.0,0.0,0.0,0.0);
	vec4 sum = vec4(0.0,0.0,0.0,0.0);
	float sum_w = 0.0;		

	vec4 texel = texture2D( tProcessorTexture, texCoord );
	origin = PROCESSORV4_FUNC( texel );
	origin.x = (origin.x - procContrastCenter) * procContrast + procContrastCenter;
	origin.y = (origin.y - procContrastCenter) * procContrast + procContrastCenter;
	origin.z = (origin.z - procContrastCenter) * procContrast + procContrastCenter;		
	origin = saturate( origin );

	const vec2 hexagon[] = {
		vec2( 1.0, 0.0 ),
		vec2( 0.5, 0.866 ),
		vec2(-0.5, 0.866 ),
		vec2(-1.0, 0.0 ),
		vec2(-0.5,-0.866 ),
		vec2( 0.5,-0.866 ),
	};

#if PROCESSOR_SIMPLE
	sum = origin;
#else
	//TODO: consider pound-define or a variable-length loop. The latter might be better because we cant be spawning shader combos in the fill effect
	if( procSharpness < 0.0 )	
	{
		//@@@ TODO: consider premult blur
		//center
		{
			texel = texture2DLod( tProcessorTexture, texCoord, procLOD );
			sum += PROCESSORV4_FUNC( texel );
			sum_w += 1.0;
		}
		//inner hexel	
		{
			HINT_UNROLL
			for( int i=0; i<6; ++i )			
			{
				vec2 uv_d = 0.5 * aspect_r * hexagon[i];
				texel = texture2DLod( tProcessorTexture, texCoord + uv_d, procLOD );
				sum += PROCESSORV4_FUNC( texel );
			}
			sum_w += 6.0;
		}
		//off-kilter hexel	
		{
			HINT_UNROLL
			for( int i=0; i<6; ++i )			
			{
				vec2 uv_d = aspect_r * hexagon[i].yx;
				texel = texture2DLod( tProcessorTexture, texCoord + uv_d, procLOD );
				sum += PROCESSORV4_FUNC( texel );
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
			texel = texture2DLod( tProcessorTexture, texCoord + uv_d, procLOD );
			sum += PROCESSORV4_FUNC( texel );
		}
		sum_w += 6.0;
	}
	sum /= sum_w;

	sum.x = saturate( (sum.x - procContrastCenter) * procContrast + procContrastCenter );
	sum.y = saturate( (sum.y - procContrastCenter) * procContrast + procContrastCenter );
	sum.z = saturate( (sum.z - procContrastCenter) * procContrast + procContrastCenter );
	
	float sharpx = saturate( origin.x + (origin.x - sum.x) * procSharpness );
	float sharpy = saturate( origin.y + (origin.y - sum.y) * procSharpness );
	float sharpz = saturate( origin.z + (origin.z - sum.z) * procSharpness );
	sum.x = mix( sum.x, sharpx, procBlurOrSharp );
	sum.y = mix( sum.y, sharpy, procBlurOrSharp );
	sum.z = mix( sum.z, sharpz, procBlurOrSharp );
#endif

	//Intensity
	sum.x = mix( sum.x, 1.0-sum.x, procInvert );
	sum.y = mix( sum.y, 1.0-sum.y, procInvert );
	sum.z = mix( sum.z, 1.0-sum.z, procInvert );
	sum.x = mix( 0.0, sum.x, procIntensity );
	sum.y = mix( 0.0, sum.y, procIntensity );
	sum.z = mix( 0.0, sum.z, procIntensity );

	//Mono to RGBA conversion (assumes independent components)
	sum = mix( sum, sum.rrra, procGray ); 

	return sum;
}

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
#undef PROCESSORV4_FUNC
#undef PROCESSORV3_FUNC
#undef PROCESSOR_FUNC
#undef PROCESSOR_NAME
#undef PROCESSOR_SIMPLE
