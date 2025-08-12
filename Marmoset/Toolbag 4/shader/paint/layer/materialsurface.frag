#ifndef MATERIAL_SURFACE_FRAG
#define MATERIAL_SURFACE_FRAG

#include "layerformat.sh"

uniform int		uReplaceColor;
uniform int		uInvert;
uniform int		uSurfaceUseRecolor;
uniform int		uNormalChannel;

uniform vec3	uSurfaceHSVRecolor;	//{ hue shift, saturation shift, value scale }
uniform vec3	uSurfaceRecolorGoalRGB;

uniform float	uSurfaceContrast;
uniform float	uSurfaceSharpen;
uniform float	uSurfaceLeftHandedNormals;



vec3	RGBtoHSV( vec3 rgb )
{
	float r = rgb.r, g = rgb.g, b = rgb.b;

	float mn = min( min( r, g ), b );
	float mx = max( max( r, g ), b );
	float chroma = mx - mn;

	float h=0.0, s=0.0, v=mx;
	HINT_FLATTEN
	if( chroma != 0.0 )
	{
		float invChroma = rcp(chroma);
		HINT_FLATTEN
		if( r == mx )
		{
			h = (g - b) * invChroma;
			h = h < 0.0 ? (h + 6.0) : h;
		}
		else if( g == mx )
		{
			h = (b - r) * invChroma + 2.0;
		}
		else
		{
			h = (r - g) * invChroma + 4.0;
		}
		h *= 60.0;
		s = chroma / mx;
	}

	return vec3( h, s, v );
}

vec3	HSVtoRGB( vec3 hsv )
{
	float h = hsv.x;
	float s = hsv.y;
	float v = hsv.z;

	float chroma = v * s;
	float hh = h * (1.0/60.0);
	float x = chroma * ( 1.0 - abs( fmod(hh,2.0) - 1.0 ) );

	vec3 rgb;
	rgb.x =	(hh < 1.0 || hh >= 5.0) ? chroma :
			(hh < 2.0 || hh >= 4.0) ? x :
			0.0;
	rgb.y = (hh < 4.0) ?
			((hh >= 1.0 && hh < 3.0) ? chroma : x) :
			0.0;
	rgb.z = (hh >= 2.0) ?
			((hh >= 3.0 && hh < 5.0) ? chroma : x) :
			0.0;

	float mn = v - chroma;
	rgb.r += mn;
	rgb.g += mn;
	rgb.b += mn;
	return rgb;
}

vec4	materialSurfaceAdjust( vec4 c )
{
	//hsv color adjustment
	HINT_BRANCH
	if( uSurfaceUseRecolor > 0 )
	{
		vec3 hsv = RGBtoHSV( c.rgb );

		//angular shift for hue
		hsv.x = fmod( hsv.x + uSurfaceHSVRecolor.x, 360.0 );
			
		//saturation as shift
		hsv.y = saturate( hsv.y + uSurfaceHSVRecolor.y );

		//value as scale
		hsv.z = hsv.z * uSurfaceHSVRecolor.z;

		c.rgb = HSVtoRGB(hsv);
	}

	//RGB contrast
	if( uNormalChannel > 0 )
	{
		//scale bias & normalize
		if( uInvert )
		{ c = vec4( 1.0 - c.r, 1.0 - c.g, c.b, c.a ); }
		c.rgb = c.rgb * 2.0 - vec3(1.0,1.0,1.0);
		vec3 recolor = uSurfaceRecolorGoalRGB*2.0 - vec3(1.0,1.0,1.0);
		c.rgb = (c.rgb - recolor)*uSurfaceContrast + recolor;
		c.rgb = normalize( c.rgb );

		//left-handed normals get a flip
		c.g *= (-2.0 * uSurfaceLeftHandedNormals) + 1.0;
		c.rgb = 0.5*c.rgb + vec3(0.5,0.5,0.5);
	}
	else
	{
		//replace color when overall contrast can't be changed
		if( uReplaceColor > 0 )
		{
			c.rgb = saturate( uSurfaceRecolorGoalRGB );
		}
		else
		{
			c.rgb = saturate( ( c.rgb - uSurfaceRecolorGoalRGB ) * uSurfaceContrast + uSurfaceRecolorGoalRGB );
		}

		if( uInvert )
		{ c.rgb = invertColorFormatted( c.rgb ); }
	}
	return c;
}

#endif