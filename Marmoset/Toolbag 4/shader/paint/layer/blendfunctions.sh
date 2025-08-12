#ifndef BLEND_FUNCTIONS_SH
#define BLEND_FUNCTIONS_SH

vec4	_stdMix( vec4 front, vec4 back, float fade )
{
	front.a = front.a * fade;
	front.rgb *= front.a;
	back.rgb *= back.a;
	front = (back * (1.0-front.a)) + front;	
	front.rgb /= max(0.001, front.a);	
	return front;
}

vec4	blendReplace( vec4 front, vec4 back, float fade )
{ 
	return front; 
}

vec4	blendFadeReplace( vec4 front, vec4 back, float fade )
{
	back.rgb *= back.a;
	front.rgb *= front.a;
	front = mix( back, front, fade );
	front.rgb /= max(0.0001, front.a); //mixing RGBA so premultiplied alpha 
	return front;
}

vec4	blendVectorAlpha( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	front.rgb = 2.0 * front.rgb - ONE;
	back.rgb = 2.0 * back.rgb - ONE;

	//Blend back against 0,0,1 vector, mix( vec3(0,0,1), back.rgb, back.a );
	back.rgb = back.rgb * back.a;
	back.b += 1.0 - back.a;

	front.rgb = normalize( mix( back.rgb, front.rgb, front.a * fade ) );
	front.rgb = 0.5 * front.rgb + HALF;
	front.a = 1.0;
	return front;
}

vec4	blendVectorDetail( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	front.xyz = 2.0 * front.rgb - ONE;
	back.xyz  = 2.0 * back.rgb - ONE;
	
	//Blend back against 0,0,1 vector, mix( vec3(0,0,1), back.rgb, back.a );
	back.rgb = back.rgb * back.a;
	back.b += 1.0 - back.a;

	front.xyz = normalize( 
		( back.xyz - vec3(0.0, 0.0, 1.0)) +
		(front.xyz - vec3(0.0, 0.0, 1.0)) * front.a * fade +
		vec3(0.0, 0.0, 1.0)
	);
	front.rgb = 0.5 * front.xyz + HALF;
	front.a = 1.0;	

	return front;
}

vec4	blendAlpha( vec4 front, vec4 back, float fade )
{
	return _stdMix( front, back, fade );
}

vec4	blendAdd( vec4 front, vec4 back, float fade )
{
	vec4 result = front;
	result.rgb = back.rgb + front.rgb;
	return _stdMix( result, back, fade );
}

vec4	blendMultiply( vec4 front, vec4 back, float fade )
{
	vec4 result = front;
	result.rgb = back.rgb * front.rgb;
	return _stdMix( result, back, fade );
}

vec4	blendOverlay( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	
	vec4 result = front;
	front.rgb = saturate(front.rgb);
	back.rgb = saturate(back.rgb);
	
	result.rgb = mix(
		saturate( 2.0 * back.rgb * front.rgb ),
		saturate( ONE - ( ONE - 2.0 * ( back.rgb - HALF ) ) * (ONE - front.rgb) ),
		vec3( greaterThan( back.rgb, HALF ) )
    );

	result = _stdMix( result, back, fade );	
	return result;
}

vec4	blendScreen( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	vec4 result = front;
	front.rgb = saturate(front.rgb);
	back.rgb = saturate(back.rgb);
	result.rgb = ONE - (ONE - back.rgb) * (ONE - front.rgb);
	return _stdMix( result, back, fade );
}

vec4	blendLighten( vec4 front, vec4 back, float fade )
{
	vec4 result = front;
	result.rgb = max(back.rgb, front.rgb);
	return _stdMix( result, back, fade );
}

vec4	blendDarken( vec4 front, vec4 back, float fade )
{
	vec4 result = front;
	result.rgb = min(back.rgb, front.rgb);
	return _stdMix( result, back, fade );
}

vec4	blendColorDodge( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	vec4 result = front;
	front.rgb = saturate(front.rgb);
	vec3 eps = vec3(0.0001, 0.0001, 0.0001);

	result.rgb = min( ONE, back.rgb / max( eps, ONE - front.rgb ) );	
	result = _stdMix( result, back, fade );
	return result;
}

vec4	blendColorBurn( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	vec4 result = front;
	front.rgb = saturate(front.rgb);
	back.rgb = saturate(back.rgb);

	vec3 eps = vec3(0.0001, 0.0001, 0.0001);
	result.rgb = saturate( (ONE - (ONE - back.rgb) / max(eps, front.rgb) ) );
	result = _stdMix( result, back, fade );
	return result;
}

vec4	blendLinearBurn( vec4 front, vec4 back, float fade )
{
	const vec3	ONE = vec3(1.0,1.0,1.0);
	const vec3	HALF = vec3(0.5,0.5,0.5);
	vec4 result = front;
	front.rgb = saturate(front.rgb);
	back.rgb = saturate(back.rgb);

	result.rgb = saturate( back.rgb + front.rgb - ONE );
	result = _stdMix( result, back, fade );
	return result;
}

#endif