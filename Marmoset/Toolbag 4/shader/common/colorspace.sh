#ifndef COLORSPACE_SH
#define COLORSPACE_SH

vec3	sRGBToLinear( vec3 srgb )
{
	vec3 black = srgb * 0.0773993808;	
	vec3 lin = (srgb + vec3(0.055,0.055,0.055)) * 0.947867299;
	lin = pow( lin, 2.4 );

	lin.r = srgb.r <= 0.04045 ? black.r : lin.r;
	lin.g = srgb.g <= 0.04045 ? black.g : lin.g;
	lin.b = srgb.b <= 0.04045 ? black.b : lin.b;
	
	return lin;
}

vec3	linearTosRGB( vec3 lin )
{
	vec3 black = 12.92 * lin;
	vec3 srgb = (1.055) * pow( lin, 0.416666667 ) - vec3(0.055,0.055,0.055);
	srgb.r = lin.r <= 0.0031308 ? black.r : srgb.r;
	srgb.g = lin.g <= 0.0031308 ? black.g : srgb.g;
	srgb.b = lin.b <= 0.0031308 ? black.b : srgb.b;
	return srgb;
}

vec3	linearTosRGBApprox( vec3 lin )
{	
	//Andres Approximation with deviation ~0.25%
	//f(x) = ( ( sqrt(x) - sqrt(x)*x)*0.921 + x*(0.4305*x + 0.5056307005) + 0.0638563) from 0.04045 to 1

	vec3 sqrtlin = sqrt(lin);
	vec3 srgb = ( (-sqrtlin*lin + sqrtlin)*0.921) + (lin*(0.4305*lin + vec3(0.5056307005, 0.5056307005, 0.5056307005)));	
	const float C = 1.055 * 0.0638563 - 0.055;
	srgb = (1.055 * srgb) + vec3(C,C,C);
	
	vec3 black = 12.92 * lin;
	srgb.r = lin.r <= 0.0031308 ? black.r : srgb.r;
	srgb.g = lin.g <= 0.0031308 ? black.g : srgb.g;
	srgb.b = lin.b <= 0.0031308 ? black.b : srgb.b;
	return srgb;
}

#endif //COLORSPACE_SH
