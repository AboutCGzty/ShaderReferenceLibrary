#ifndef MSET_FRESNEL_FRAG
#define MSET_FRESNEL_FRAG

float fresnelSchlick( float cosTheta )
{
	float f = saturate( 1.0 - cosTheta );
	float f2 = f*f; f *= f2*f2; //f=f^5
	return f;
}

float fresnelSchlick( float F0, float Fintensity, float cosTheta )
{
	float F = fresnelSchlick( cosTheta );
	return mix( F0, 1.0, F * Fintensity );
}

vec3 fresnelSchlick( vec3 F0, vec3 Fintensity, float cosTheta )
{
	float F = fresnelSchlick( cosTheta );
	return mix( F0, vec3(1.0, 1.0, 1.0), F * Fintensity );
}

vec3 fresnelSchlick( vec3 F0, vec3 Fintensity, float cosThetaI, float eta )
{
	float cosTheta = abs( cosThetaI );
	HINT_FLATTEN if( cosThetaI < 0.0 )
	{
		//incident vector changes medium; invert eta
		eta = rcp( eta );
	}
	HINT_FLATTEN if( eta > 1.0 )
	{
		//going from more to less dense medium; handle potential TIR
		float sinThetaT2 = saturate( eta*eta * saturate( 1.0 - cosThetaI*cosThetaI ) );
		//use cosThetaT for Schlick approximation
		cosTheta = sqrt( 1.0 - sinThetaT2 );
	}
	return fresnelSchlick( F0, Fintensity, cosTheta );
}

float fresnelDielectric( float cosThetaI, float eta )
{
	HINT_FLATTEN if( cosThetaI < 0.0 )
	{
		//incident vector changes medium; invert eta
		eta = rcp( eta );
	}
	float sinThetaI = sqrt( saturate( 1.0 - cosThetaI*cosThetaI ) );
	float sinThetaT = eta * sinThetaI;

	if( sinThetaT >= 1.0 )
	{
		//total internal reflection
		return 1.0;
	}
	else
	{
		float cosThetaT = sqrt( 1.0 - sinThetaT*sinThetaT );
		float r1 = ( abs(cosThetaI) - eta * cosThetaT ) / ( abs(cosThetaI) + eta * cosThetaT );
		float r2 = ( abs(cosThetaI) * eta - cosThetaT ) / ( abs(cosThetaI) * eta + cosThetaT );
		return 0.5 * ( r1*r1 + r2*r2 );
	}
}

vec4 fresnelDielectric( float cosThetaI, float eta, vec3 reflectivity )
{
	vec4 F;
	F.w   = fresnelDielectric( cosThetaI, eta );
	F.rgb = reflectivity * F.w;
	return F;
}

#endif