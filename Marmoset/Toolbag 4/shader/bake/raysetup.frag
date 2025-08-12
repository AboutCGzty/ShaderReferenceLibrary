#include "../common/octpack.sh"
#include "brushClip.frag"
#include "utils.frag"

uniform float	uTraceDirScale;
uniform float	uTraceBias;

uniform uint	uRowWidth;

uniform int		uUsingCustomCage;
USE_BUFFER(vec4,bCustomOffset);

USE_INTERLOCKED_BUFFER(bCount,1);
USE_LOADSTORE_BUFFER(vec4,bRays,2);

HINT_EARLYDEPTHSTENCIL
BEGIN_PARAMS
	INPUT0(vec3,fPosition)
	INPUT1(vec2,fTexCoord)
	INPUT2(vec3,fBakeDir)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	OUT_COLOR0 = vec4( 0.0, 0.0, 0.0, 0.0 );

	// check brush mask
	if( !brushClip(fTexCoord) )
	{
		return;
	}

	// find trace direction and origin
	vec3 traceDir = findTraceDirection( fPosition, normalize( fBakeDir ), fTexCoord );
	vec3 tracePos;
	HINT_BRANCH if( uUsingCustomCage )
	{
		uint index = IN_POSITION.y * uRowWidth + IN_POSITION.x;
		vec3 cagePos = bCustomOffset[index].xyz;
		tracePos = findTraceOriginWithCustomCage( fPosition, traceDir, cagePos );
	}
	else
	{
		tracePos = findTraceOrigin( fPosition, traceDir, fTexCoord );
	}

	traceDir *= uTraceDirScale;
	tracePos += traceDir * uTraceBias;

	// ray buffer is:
	// { Px, Py, Pz, D }
	vec4 writeOut;
	writeOut.xyz = tracePos;
	writeOut.w = asfloat( packUnitVectorOct( traceDir ) );

	uint index;
	interlockedAdd(bCount,0,1,index);

	bRays[index] = writeOut;
	OUT_COLOR0.x = asfloat(index);
}
