#include "../common/util.sh"

uniform mat4	uModelMatrix;
uniform vec3	uOrigin;
uniform vec3	uU;
uniform vec3	uV;
uniform vec3 	uN;
uniform float	uRadius;
uniform mat4 	uModelInverseTranspose;
uniform int		u3DSpace;			//Are we doing this in 3D space? (i.e. viewport preview)
uniform mat4	uCameraMatrix;		//modelviewprojection of camera
BEGIN_PARAMS
	INPUT0(vec3,vPosition)
	INPUT1(vec3,vTangent)
	INPUT2(vec3,vBitangent)
	INPUT3(vec3,vNormal)
	INPUT4(vec2,vTexCoord0)
	INPUT5(vec2,vTexCoord1)
	INPUT6(vec4,vColor)


	//fourth component is the splot radius
	OUTPUT0(vec3,fNormal)		
    OUTPUT1(vec3,fLocalCoord)	//spherespace vertex
	OUTPUT2(float, fAlphaMult)

END_PARAMS
{
	vec3 u = vTangent;
	vec3 v = vBitangent;
	vec3 n = vNormal;
	
	u = u * 2.0 - 1.0;
	v = v * 2.0 - 1.0;
	n = n * 2.0 - 1.0;

	//if the coords aren't right-handed, flip them around
	if(dot(cross(u, v), n) < 0.0)
	{ u *= -1.0; }
//	u = vec3(0.0, 0.0, 1.0);
//	v = vec3(0.0, 1.0, 0.0);
//	n = vec3(1.0, 0.0, 0.0);
//	n = cross(u, v);
//	u = cross(v, n);
	//transform the point into spherespace with the camera pointing down the normal
	
	u = normalize(mulVec(uModelInverseTranspose, u));
	v = normalize(mulVec(uModelInverseTranspose, v));
	n = normalize(mulVec(uModelInverseTranspose, n));
	vec3 vertexNormal = n;
//	u = normalize(cross(v, n));
//	v = normalize(cross(n, u));
	u = uU;
	v = uV;
	n = uN;
	vec3 p = mulPoint( uModelMatrix, vPosition ).xyz; 
	p -= uOrigin;
	p /= uRadius * 1.5;		//increase our radius a bit to responsd to geometry before we hit it
	float planeDistance = (dot(p, n));
//	planeDistance = -0.99;
	float uPart = dot(u, p);
	float vPart = dot(v, p);
	float relRadius = sqrt(max(1.0-planeDistance*planeDistance, 0.0));
	vec3 ssPos = vec3(uPart, vPart, planeDistance);//planeDistance * n + u * uPart + v * vPart;
	fLocalCoord = ssPos;
	vec4 projCoord = mulPoint(uCameraMatrix, mulPoint( uModelMatrix, vPosition ).xyz);
//	relRadius = 1.0;
	OUT_POSITION.xyz = ssPos;
	OUT_POSITION.z = 0.0;
//	OUT_POSITION.xyz = p.zxy;
//	OUT_POSITION.z = 0.01;
	OUT_POSITION.w = 1.0;
//	OUT_POSITION.xyz = vPosition * 0.002;
	OUT_POSITION = mix(OUT_POSITION, projCoord, float(u3DSpace));
//	OUT_POSITION.z = 0.1;
	fNormal = n;
	fNormal.x = uPart;
	fNormal.y = vPart;
//	fNormal.y = dot(vec3(0, 0, 1), p);
//	fNormal.y = p.z - uOrigin.z;
	fNormal.z = relRadius;
//	fNormal = n;
//	fNormal = vec3(0.5, 1.0, 0.5);
	fNormal = n * 0.5 + 0.5;
	fNormal = vertexNormal * 0.5 + 0.5;
	fAlphaMult = mix(1.0, 5.0, float(u3DSpace));
	
//	fNormal = n;
//	fNormal = ssPos;
}
