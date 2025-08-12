#ifndef LAYER_FORMAT_SH
#define LAYER_FORMAT_SH

#include "data/shader/common/colorspace.sh"

#define FORMAT_R	0
#define FORMAT_RG	1
#define FORMAT_RGBA 2

uniform int		uInputFormat;
uniform int		uOutputFormat;
uniform float	usRGBToLinearLUT[256];

uniform float	uInputLeftHandedNormals;
uniform float	uOutputLeftHandedNormals;

vec3	sRGBToLinearApprox( vec3 srgb )
{
	srgb = saturate(srgb);
	vec3 j = ceil(srgb*255.0);	
	vec3 lin;
	lin.r = usRGBToLinearLUT[int(j.r)];
	lin.g = usRGBToLinearLUT[int(j.g)];
	lin.b = usRGBToLinearLUT[int(j.b)];
	return lin;
}

//NOTE: keep these up to date with FormatStage::convertColor
vec4	formatInputColor( int inmode, vec4 color )
{
	//converts input format to RGBA color
	//R		0	.rrr1
	//RG 	1	.rrrg
	vec4 result = vec4(	color.r,
					(inmode < FORMAT_RGBA) ? color.r : color.g,
					(inmode < FORMAT_RGBA) ? color.r : color.b,
					(inmode == FORMAT_RG) ? color.g : color.a	);

	result.y = mix( result.y, 1.0-result.y, uInputLeftHandedNormals );	//convert input TO right-handed normals
	return result;
}

vec4	formatOutputColor( int outmode, vec4 color )
{
	color.y = mix( color.y, 1.0-color.y, uOutputLeftHandedNormals );	//convert result FROM right-handed normals TO output

	//converts from RGBA color to selected output
	//R		.r***
	//RG 	.ra**
	color.g = (outmode == FORMAT_RG) ? color.a : color.g;	
	return color;
}

//same as formatOutput but converts prepass result back to input format for the next pass
vec4	formatOutputPrepass( vec4 color )
{
	color.y = mix( color.y, 1.0-color.y, uInputLeftHandedNormals );		//convert result FROM right-handed normals TO input format again

	//converts from RGBA color to selected output
	//R		.r***
	//RG 	.ra**
	color.g = (uInputFormat == FORMAT_RG) ? color.a : color.g;	
	return color;
}

// gamma-corrected one_minus_color function for inverting sRGB colors in the proper space
vec3	invertColorFormatted( vec3 c )
{
	#if defined(LAYER_OUTPUT_SRGB) || defined(LAYER_EMULATE_SRGB)
		c.rgb = linearTosRGB(c.rgb);
	#endif

	c = vec3(1.0,1.0,1.0) - c;
	#if defined(LAYER_OUTPUT_SRGB) || defined(LAYER_EMULATE_SRGB)
		c.rgb = sRGBToLinear(c.rgb);
	#endif
	return c;
}

#endif
