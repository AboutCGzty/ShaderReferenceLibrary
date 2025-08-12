#include "data/shader/common/projector.sh"

float   ParallaxTextureSampleLod( uint index, vec2 coord, float lod, float defaultValue )
{
	const bool flagGrayscale = index & TEXTURE_FLAG_GRAYSCALE;
#ifdef MATERIAL_TEXTURE_MODE_UDIM
	const bool flagUDIM      = index & TEXTURE_FLAG_UDIM_MODE;
#endif
	const uint channel 		 = (index & TEXTURE_FLAG_CHANNEL) >> uint(29);
	index &= ~uint(TEXTURE_FLAG_MASK);
	
#ifdef MATERIAL_TEXTURE_MODE_UDIM
	if( flagUDIM )
	{
		textureMaterialResolveUDIM( index, vec4( coord, 0, 0 ) );
	}
#endif

	float value = defaultValue;
	if( index )
	{
		#if defined(MATERIAL_TEXTURE_UNIFORM) && \
		   !defined(MATERIAL_TEXTURE_MODE_UDIM) //UDIMs can make resource indices diverge across lanes when shading the same material
			vec4 color = textureWithSamplerLod( resourceByUniformIndex(tGlobalTextures, index),
												sMaterialSampler,
												coord.xy,
												lod );
		#else
			vec4 color = textureWithSamplerLod( resourceByIndex(tGlobalTextures, index),
												sMaterialSampler,
												coord.xy,
												lod );
		#endif
		switch( channel )
		{
		case 0: value = color.r; break;
		case 1: value = color.g; break;
		case 2: value = color.b; break;
		case 3: value = color.a; break;
		}
	}
	return value;
}

float	ParallaxSample( uint texture, vec2 c )
{
	return 1.0 - ParallaxTextureSampleLod( texture, c, 0.0, 1.0 );
}

float	ParallaxSample( uint texture, TriplanarProjector proj, vec2 cX, vec2 cY, vec2 cZ )
{
	vec4 tapX = ParallaxTextureSampleLod( texture, cX, 0.0, 1.0 );
	vec4 tapY = ParallaxTextureSampleLod( texture, cY, 0.0, 1.0 );
	vec4 tapZ = ParallaxTextureSampleLod( texture, cZ, 0.0, 1.0 );
	return 1.0 - triplanarMix( proj, tapX, tapY, tapZ ).x;
}

struct	DisplacementParallaxMapParams
{
	uint	heightTexture;
	uint	depthOffset;
};
void	DisplacementParallaxMap( in DisplacementParallaxMapParams p, inout MaterialState m, inout FragmentState s )
{
	#if defined(MATERIAL_PASS_PAINT) || defined(MATERIAL_PASS_COLOR_SAMPLE)
		//NOTE: It is possible for parallax to override Height Map displacement value.
		// Addition will not work if the default displacement value is 0.5 --Andres
		float displacement = textureMaterial( p.heightTexture, s.vertexTexCoord.uvCoord, 0.0 );
		m.displacement = vec3( displacement, displacement, displacement );
	#else
	vec2 depthOffset = vec2( f16tof32(p.depthOffset), f16tof32(p.depthOffset>>16) );

	vec3 dir =	vec3(	dot( -s.vertexEye, s.vertexTangent ),
						dot( -s.vertexEye, s.vertexBitangent ),
						dot( -s.vertexEye, s.vertexNormal )	);
	vec2 maxOffset = dir.xy * (depthOffset.x / (abs(dir.z) + 0.001));

	float minSamples = 16.0;
	float maxSamples = 128.0;
	float samples = saturate( 3.0*length(maxOffset) );
	float incr = rcp( mix( minSamples, maxSamples, samples ) );

	float h0;
#ifdef MATERIAL_TEXTURE_MODE_TRIPLANAR
	vec2 tc0X = m.vertexTexCoord.projectorCoord.uvX.xy - depthOffset.y*maxOffset;
	vec2 tc0Y = m.vertexTexCoord.projectorCoord.uvY.xy - depthOffset.y*maxOffset;
	vec2 tc0Z = m.vertexTexCoord.projectorCoord.uvZ.xy - depthOffset.y*maxOffset;
	h0 = ParallaxSample( p.heightTexture, m.vertexTexCoord.projectorCoord, tc0X, tc0Y, tc0Z );
	HINT_LOOP
	for( float i=incr; i<=1.0; i+=incr )
	{
		vec2 tcX = tc0X + maxOffset * i;
		vec2 tcY = tc0Y + maxOffset * i;
		vec2 tcZ = tc0Z + maxOffset * i;
		float h1 = ParallaxSample( p.heightTexture, m.vertexTexCoord.projectorCoord, tcX, tcY, tcZ );
		if( i >= h1 )
		{
			//hit! now interpolate
			float r1 = i, r0 = i-incr;
			float t = (h0-r0)/((h0-r0)+(-h1+r1));
			float r = (r0-t*r0) + t*r1;
			m.vertexTexCoord.projectorCoord.uvX.xy = tc0X + r*maxOffset;
			m.vertexTexCoord.projectorCoord.uvY.xy = tc0Y + r*maxOffset;
			m.vertexTexCoord.projectorCoord.uvZ.xy = tc0Z + r*maxOffset;
			break;
		}
		else
		{
			m.vertexTexCoord.projectorCoord.uvX.xy = tc0X + maxOffset;
			m.vertexTexCoord.projectorCoord.uvY.xy = tc0Y + maxOffset;
			m.vertexTexCoord.projectorCoord.uvZ.xy = tc0Z + maxOffset;
		}
		h0 = h1;
	}
		#endif // MATERIAL_TEXTURE_MODE_TRIPLANAR
    vec2 tc0 = m.vertexTexCoord.uvCoord.xy - depthOffset.y * maxOffset;
	h0 = ParallaxSample( p.heightTexture, tc0 );
	HINT_LOOP
	for( float i=incr; i<=1.0; i+=incr )
	{
		vec2 tc = tc0 + maxOffset * i;
		float h1 = ParallaxSample( p.heightTexture, tc );
		if( i >= h1 )
		{
			//hit! now interpolate
			float r1 = i, r0 = i-incr;
			float t = (h0-r0)/((h0-r0)+(-h1+r1));
			float r = (r0-t*r0) + t*r1;
            m.vertexTexCoord.uvCoord.xy = tc0 + r * maxOffset;
			break;
		}
		else
		{
            m.vertexTexCoord.uvCoord.xy = tc0 + maxOffset;
        }
		h0 = h1;
	}
	#endif // MATERIAL_PASS_PAINT || MATERIAL_PASS_COLOR_SAMPLE
}

void DisplacemenParallaxMapMerge( in MaterialState m, inout FragmentState s )
{
#if defined( MATERIAL_PASS_PAINT ) || defined( MATERIAL_PASS_COLOR_SAMPLE )
	s.displacement = m.displacement;
#endif
}

#define DisplacementParams		DisplacementParallaxMapParams
#define Displacement(p,m,s)		DisplacementParallaxMap(p.displacement,m,s)
#define DisplacementMerge		DisplacemenParallaxMapMerge
#define DisplacementApply(s)
